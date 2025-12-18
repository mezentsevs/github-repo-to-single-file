import type { DownloadOptions } from './types.js';

export function parseArguments(): DownloadOptions {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('ERROR: Repository not specified');
        console.info('Usage: npm start -- <owner/repo> [branch] [output-file]');
        console.info('Example: npm start -- facebook/react main react_code.txt');

        process.exit(1);
    }

    const repository = args[0];

    if (!repository.includes('/')) {
        console.error('ERROR: Repository must be in format "owner/repo"');
        console.info('Example: facebook/react');

        process.exit(1);
    }

    const options: DownloadOptions = {
        repository,
        branch: args[1] || 'main',
        outputFile: args[2] || undefined,
    };

    console.log('CLI Arguments:');
    console.log(`  Repository: ${options.repository}`);
    console.log(`  Branch: ${options.branch}`);

    if (options.outputFile) {
        console.log(`  Output file: ${options.outputFile}`);
    }

    return options;
}
