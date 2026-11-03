import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

const database = new PGlite();
const admin = "11111111-1111-4111-8111-111111111111";
const stranger = "22222222-2222-4222-8222-222222222222";
const published = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const draft = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

async function as(role: string, user = "") {
  await database.exec(
    `reset role; select set_config('request.jwt.claim.sub', '${user}', false); select set_config('request.jwt.claim.role', '${role}', false); set role ${role};`,
  );
}

beforeAll(async () => {
  // Simula las interfaces de Auth/Storage de Supabase, sin servicios externos.
  await database.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('${admin}'), ('${stranger}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    grant all on all tables in schema storage to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  `);
  await database.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610290001_initial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await database.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202611020001_allow_mp4.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await database.exec(`insert into public.admin_users values ('${admin}');`);
  await as("service_role");
  await database.exec(`insert into public.videos(id,title,video_path,poster_path,status,published_at) values
    ('${published}','Publicado','${admin}/${published}/video.webm','${admin}/${published}/poster.jpg','published',now()),
    ('${draft}','Privado','${admin}/${draft}/video.webm','${admin}/${draft}/poster.jpg','draft',null);
    insert into public.video_links(video_id,label,url) values ('${published}','Público','https://example.com'),('${draft}','Privado','https://example.com');
    insert into storage.objects(bucket_id,name) values ('drafts','${admin}/${draft}/video.webm');`);
}, 30000);
afterAll(async () => {
  await database.close();
});

describe.sequential(
  "políticas PostgreSQL reales en una instancia local en memoria",
  () => {
    it("permite MP4 y conserva WebM, imágenes y límites en ambos buckets", async () => {
      await as("service_role");
      const { rows } = await database.query(
        "select id, file_size_limit, allowed_mime_types from storage.buckets order by id",
      );
      expect(rows).toEqual(
        ["drafts", "published"].map((id) => ({
          id,
          file_size_limit: 41943040,
          allowed_mime_types: [
            "video/webm",
            "video/mp4",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
        })),
      );
    });
    it("un visitante solo ve publicaciones y sus enlaces", async () => {
      await as("anon");
      expect(
        (await database.query("select title from public.videos")).rows,
      ).toEqual([{ title: "Publicado" }]);
      expect(
        (await database.query("select label from public.video_links")).rows,
      ).toEqual([{ label: "Público" }]);
      expect(
        (await database.query("select * from storage.objects")).rows,
      ).toHaveLength(0);
      await expect(
        database.query("select * from public.admin_users"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        database.query("update public.videos set title='Ataque'"),
      ).rejects.toThrow(/permission denied/);
    });
    it("una cuenta autenticada no autorizada no puede gestionar videos ni cargar archivos", async () => {
      await as("authenticated", stranger);
      expect(
        (await database.query("select public.is_admin() as allowed")).rows,
      ).toEqual([{ allowed: false }]);
      await expect(
        database.query(
          `insert into public.videos(id,title,video_path,poster_path) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Ataque','${stranger}/cccccccc-cccc-4ccc-8ccc-cccccccccccc/v.webm','${stranger}/cccccccc-cccc-4ccc-8ccc-cccccccccccc/p.jpg')`,
        ),
      ).rejects.toThrow();
      expect(
        (
          await database.query(
            "update public.videos set title='Ataque' returning id",
          )
        ).rows,
      ).toHaveLength(0);
      await expect(
        database.query(
          `insert into storage.objects(bucket_id,name) values ('drafts','${stranger}/x/v.webm')`,
        ),
      ).rejects.toThrow(/row-level security/);
      await expect(
        database.query(`select public.save_video('${draft}','{}','[]')`),
      ).rejects.toThrow(/Not authorized/);
    });
    it("el administrador ve borradores pero no puede publicar saltándose la función de servidor", async () => {
      await as("authenticated", admin);
      expect(
        (await database.query("select public.is_admin() as allowed")).rows,
      ).toEqual([{ allowed: true }]);
      expect(
        (await database.query("select id from public.videos")).rows,
      ).toHaveLength(2);
      expect(
        (await database.query("select * from storage.objects")).rows,
      ).toHaveLength(1);
      await expect(
        database.query(
          `update public.videos set status='published',published_at=now() where id='${draft}'`,
        ),
      ).rejects.toThrow(/manage-video/);
      await expect(
        database.query(
          `insert into storage.objects(bucket_id,name) values ('published','${admin}/x/v.webm')`,
        ),
      ).rejects.toThrow(/row-level security/);
      await expect(
        database.query(`delete from public.videos where id='${draft}'`),
      ).rejects.toThrow(/permission denied/);
    });
    it("guarda metadatos y enlaces atómicamente y revierte un recurso inválido", async () => {
      await as("authenticated", admin);
      const payload = {
        title: "Actualizado",
        description: "Contexto",
        tags: ["demo"],
        video_path: `${admin}/${draft}/video.webm`,
        poster_path: `${admin}/${draft}/poster.jpg`,
        duration: 10,
      };
      await database.query("select public.save_video($1,$2,$3)", [
        draft,
        JSON.stringify(payload),
        JSON.stringify([{ label: "Repo", url: "https://github.com/furthurr" }]),
      ]);
      expect(
        (
          await database.query("select title from public.videos where id=$1", [
            draft,
          ])
        ).rows,
      ).toEqual([{ title: "Actualizado" }]);
      await expect(
        database.query("select public.save_video($1,$2,$3)", [
          draft,
          JSON.stringify({ ...payload, title: "No debe persistir" }),
          JSON.stringify([{ label: "Script", url: "javascript:alert(1)" }]),
        ]),
      ).rejects.toThrow();
      expect(
        (
          await database.query("select title from public.videos where id=$1", [
            draft,
          ])
        ).rows,
      ).toEqual([{ title: "Actualizado" }]);
      expect(
        (
          await database.query(
            "select label from public.video_links where video_id=$1",
            [draft],
          )
        ).rows,
      ).toEqual([{ label: "Repo" }]);
    });
    it("el rol de servidor sí puede cambiar el estado de publicación", async () => {
      await as("service_role");
      await database.query(
        "update public.videos set status='published',published_at=now() where id=$1",
        [draft],
      );
      await as("anon");
      expect(
        (await database.query("select id from public.videos")).rows,
      ).toHaveLength(2);
    });
  },
);
