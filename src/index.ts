import { GitHubRepoDownloader } from './downloader.js';
import { parseArguments } from './cli.js';

async function main(): Promise<void> {
    try {
        const options = parseArguments();
        const downloader = new GitHubRepoDownloader();

        const result = await downloader.downloadRepository(options);

        console.log('\n✅ Download completed successfully!');
        console.log('─'.repeat(50));
        console.log(`ℹ  Summary:`);
        console.log(`Repository: ${result.repository}`);
        console.log(`Branch: ${result.branch}`);
        console.log(`Files processed: ${result.totalFiles}`);
        console.log(`Total size: ${result.totalSize.toLocaleString()} characters`);
        console.log(`Output file: ${result.outputFile}`);
        console.log(`Duration: ${result.duration}ms`);
        console.log('─'.repeat(50));
        console.log('🎉 Check your output file for the complete repository content.');
    } catch (error) {
        console.error('\n❌ Application failed:', error);

        process.exit(1);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);

    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);

    process.exit(1);
});

main();
