export interface Config {
    readonly GITHUB_TOKEN: string;
    readonly INCLUDE_PATTERNS: string[];
    readonly EXCLUDE_PATTERNS: string[];
    readonly OUTPUT_DIR: string;
    readonly API_DELAY_MS: number;
}

export interface DownloadOptions {
    readonly repository: string;
    readonly branch?: string;
    readonly outputFile?: string;
}

export interface GitHubTreeItem {
    readonly path: string;
    readonly type: 'blob' | 'tree';
    readonly sha: string;
    readonly size?: number;
}

export interface FileContent {
    readonly path: string;
    readonly content: string;
    readonly size: number;
}

export interface DownloadResult {
    readonly repository: string;
    readonly branch: string;
    readonly totalFiles: number;
    readonly totalSize: number;
    readonly outputFile: string;
    readonly duration: number;
}
