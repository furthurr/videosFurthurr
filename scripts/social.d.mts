export declare function escapeHtml(value: string): string;
export declare function stripSiteMetadata(html: string): string;
export declare function applySiteMetadata(
  template: string,
  site: string,
  basePath: string,
): string;
export declare function renderVideoPage(
  template: string,
  video: {
    id: string;
    title: string;
    description: string;
    poster_path: string;
  },
  site: string,
  storageUrl: string,
): string;
