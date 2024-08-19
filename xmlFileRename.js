const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const fse = require('fs-extra');

async function renameFilesInZip(zipPath, outputDir) {
    // Create a temporary extraction directory
    const tempDir = path.join(outputDir, 'temp_extracted_files');
    await fse.ensureDir(tempDir);

    // Extract the zip file
    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .promise();

    // Read all the XML files in the temp directory
    const files = fs.readdirSync(tempDir).filter(file => file.endsWith('.xml'));

    for (const filename of files) {
        const filePath = path.join(tempDir, filename);

        // Read and parse the XML file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fileContent);

        // Find the <NAME> tag within the <substation> tag
        const nameTag = result?.substation?.NAME?.[0];
        if (nameTag) {
            // Get the name value and format it
            const newName = nameTag.trim().replace(/ /g, '_');

            // Determine the new file name
            let newFileName;
            if (filename.includes('_PLACEMENT_SCHEMATICS_')) {
                newFileName = `${newName}_PLACEMENTS_SCHEMATICS.xml`;
            } else {
                newFileName = `${newName}.xml`;
            }

            // Create a new directory for the renamed file
            const newDir = path.join(outputDir, newName);
            await fse.ensureDir(newDir);

            // Move and rename the file to the new directory
            const newFilePath = path.join(newDir, newFileName);
            fs.renameSync(filePath, newFilePath);
        }
    }

    // Clean up the temporary extraction directory
    fse.removeSync(tempDir);
}

// Example usage:
const zipPath = '/path/to/your/zipfile.zip';
const outputDir = '/path/to/output/directory';
renameFilesInZip(zipPath, outputDir).then(() => {
    console.log('Files renamed and saved successfully.');
}).catch(err => {
    console.error('Error processing files:', err);
});
