import { config } from './config.js';
import fs from 'fs/promises';
import path from 'path';
import type {
    DownloadOptions,
    DownloadResult,
    FileContent,
    GitHubTreeItem,
} from './types.js';

export class GitHubRepoDownloader {
    private readonly headers: HeadersInit;
    private readonly apiBaseUrl = 'https://api.github.com';

    constructor() {
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Repo-Downloader',
        };

        if (config.GITHUB_TOKEN) {
            this.headers['Authorization'] = `token ${config.GITHUB_TOKEN}`;
        }
    }

    private getOwnerAndRepo(repository: string): [string, string] {
        const [owner, repo] = repository.split('/');
        return [owner, repo];
    }

    private patternToRegex(pattern: string): RegExp {
        const escapedPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '___GLOB_STAR___')
            .replace(/\*/g, '[^/]*')
            .replace(/___GLOB_STAR___/g, '.*');

        return new RegExp(`^${escapedPattern}$`);
    }

    private matchesPattern(filePath: string, pattern: string): boolean {
        if (pattern.includes('**') || (pattern.includes('*') && pattern.includes('/'))) {
            const regex = this.patternToRegex(pattern);

            return regex.test(filePath);
        }

        if (pattern.startsWith('*') && pattern.endsWith('*') && pattern.length > 1) {
            const content = pattern.slice(1, -1);

            return filePath.includes(content);
        }

        if (pattern.startsWith('*')) {
            const extension = pattern.slice(1);
            return filePath.endsWith(extension);
        }

        return filePath === pattern;
    }

    private shouldIncludeFile(filePath: string): boolean {
        if (config.INCLUDE_PATTERNS.length > 0) {
            let included = false;

            for (const pattern of config.INCLUDE_PATTERNS) {
                if (this.matchesPattern(filePath, pattern)) {
                    included = true;

                    break;
                }
            }

            if (!included) {
                return false;
            }
        }

        for (const pattern of config.EXCLUDE_PATTERNS) {
            if (this.matchesPattern(filePath, pattern)) {
                return false;
            }
        }

        return true;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async fetchWithRetry(
        url: string, 
        retries = 3, 
        delayMs = 1000
    ): Promise<Response> {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, { headers: this.headers });

                if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
                    const resetTime = response.headers.get('x-ratelimit-reset');

                    if (resetTime) {
                        const waitTime = parseInt(resetTime) * 1000 - Date.now() + 1000;
                        
                        console.warn(`Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
                        await this.delay(waitTime);

                        continue;
                    }
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }

                console.warn(`Request failed (attempt ${i + 1}/${retries}), retrying...`);
                await this.delay(delayMs * (i + 1));
            }
        }

        throw new Error('Max retries exceeded');
    }

    public async getRepositoryTree(options: DownloadOptions): Promise<GitHubTreeItem[]> {
        const [owner, repo] = this.getOwnerAndRepo(options.repository);
        const branch = options.branch || 'main';

        console.log(`Getting repository tree for ${owner}/${repo} (branch: ${branch})...`);

        const treeUrl = `${this.apiBaseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

        try {
            const response = await this.fetchWithRetry(treeUrl);
            const data = await response.json() as { tree: GitHubTreeItem[] };

            const files = data.tree.filter(item => 
                item.type === 'blob' && this.shouldIncludeFile(item.path)
            );

            console.log(`Found ${files.length} files after applying filters`);

            return files;
        } catch (error) {
            console.error('Failed to fetch repository tree:', error);

            throw error;
        }
    }

    public async downloadFileContent(
        options: DownloadOptions, 
        item: GitHubTreeItem
    ): Promise<FileContent> {
        await this.delay(config.API_DELAY_MS);

        const [owner, repo] = this.getOwnerAndRepo(options.repository);
        const branch = options.branch || 'main';
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;

        try {
            const response = await this.fetchWithRetry(rawUrl);
            const content = await response.text();

            return {
                path: item.path,
                content,
                size: content.length,
            };
        } catch (error) {
            console.warn(`Failed to download ${item.path}:`, (error as Error).message);

            return {
                path: item.path,
                content: `[Failed to download: ${(error as Error).message}]`,
                size: 0,
            };
        }
    }

    public async downloadAllFiles(
        options: DownloadOptions, 
        files: GitHubTreeItem[]
    ): Promise<FileContent[]> {
        console.log('Downloading files...');

        const contents: FileContent[] = [];
        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const progress = Math.round(((i + 1) / totalFiles) * 100);

            process.stdout.write(`\rProgress: ${i + 1}/${totalFiles} (${progress}%) - ${file.path.substring(0, 50)}${file.path.length > 50 ? '...' : ''}`);

            const content = await this.downloadFileContent(options, file);
            contents.push(content);
        }

        process.stdout.write('\n');

        return contents;
    }

    private generateOutputFileName(options: DownloadOptions): string {
        const [owner, repo] = this.getOwnerAndRepo(options.repository);
        const branch = options.branch || 'main';
        const safeName = `${owner}_${repo}_${branch}`.replace(/[^a-zA-Z0-9_-]/g, '_');

        return options.outputFile || `${safeName}.txt`;
    }

    public async createSingleFile(
        options: DownloadOptions, 
        contents: FileContent[]
    ): Promise<string> {
        console.log('Creating single output file...');

        const outputFileName = this.generateOutputFileName(options);
        const outputPath = path.join(config.OUTPUT_DIR, outputFileName);

        await fs.mkdir(config.OUTPUT_DIR, { recursive: true });

        const outputLines: string[] = [
            `GitHub Repository: ${options.repository}`,
            `Branch: ${options.branch || 'main'}`,
            `Generated: ${new Date().toISOString()}`,
            `Total Files: ${contents.length}`,
            '='.repeat(80),
            '',
        ];

        let totalSize = 0;

        for (const file of contents) {
            outputLines.push(
                `=== ${file.path} ===`,
                `Size: ${file.size} characters`,
                '-'.repeat(60),
                file.content,
                '\n'
            );

            totalSize += file.size;
        }

        const outputContent = outputLines.join('\n');
        await fs.writeFile(outputPath, outputContent, 'utf-8');

        return outputPath;
    }

    public async downloadRepository(options: DownloadOptions): Promise<DownloadResult> {
        const startTime = Date.now();

        console.log('Starting GitHub Repository Downloader');
        console.log('─'.repeat(50));

        try {
            const files = await this.getRepositoryTree(options);

            if (files.length === 0) {
                console.log('No files to download after filtering');

                return {
                    repository: options.repository,
                    branch: options.branch || 'main',
                    totalFiles: 0,
                    totalSize: 0,
                    outputFile: '',
                    duration: Date.now() - startTime,
                };
            }

            const contents = await this.downloadAllFiles(options, files);
            const outputFile = await this.createSingleFile(options, contents);
            const duration = Date.now() - startTime;

            return {
                repository: options.repository,
                branch: options.branch || 'main',
                totalFiles: contents.length,
                totalSize: contents.reduce((sum, file) => sum + file.size, 0),
                outputFile,
                duration,
            };
        } catch (error) {
            console.error('Download failed:', error);

            throw error;
        }
    }
}
