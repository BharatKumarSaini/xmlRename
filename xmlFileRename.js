const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const fse = require('fs-extra');


async function renameFilesInZip(zipPath, outputDir, zipFile) {
    // Create a temporary extraction directory
    const tempDir = path.join(outputDir, 'temp_extracted_files');
    await fse.ensureDir(tempDir);


    // const renamedFilesDir = path.join(outputDir, 'renamedFiles');
    // await fse.ensureDir(renamedFilesDir);


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
        const nameTag = result?.Substation?.Name[0]
        || result?.DistributionSystem?.Substation[0]?.Name[0]
        || "Name_Not_Found$";


        if (nameTag) {
            // Get the name value and format it
            const newName = nameTag;
            // Determine the new file name
            let newFileName;
            if (filename.includes('PLACEMENTS_SCHEMATIC')) {
                newFileName = `${newName}_PLACEMENTS_SCHEMATIC.xml`;
            } else {
                newFileName = `${newName}.xml`;
            }
            // Create a new directory for the renamed file
            const newDir = path.join(outputDir, zipFile);
            await fse.ensureDir(newDir)


            const newCollectiveDir = path.join(renamedFilesDir,newFileName)
            // Move and rename the file to the new directory
            const newFilePath = path.join(newDir, newFileName);
            fs.renameSync(filePath, newFilePath);


            // for having a copy in a single folder
            // await fse.copy(newFilePath, newCollectiveDir);
        }
    }


    // Clean up the temporary extraction directory
    fse.removeSync(tempDir);
}








async function processZipFilesInDirectory(inputDir, outputDir) {
    // Ensure output directory exists
    await fse.ensureDir(outputDir);
   
    // Read all files in the input directory
    const files = fs.readdirSync(inputDir);
   
    // Filter for ZIP files
    const zipFiles = files.filter(file => file.endsWith('.zip'));
   
    // Process each ZIP file
    for (const zipFile of zipFiles) {
        const zipPath = path.join(inputDir, zipFile);
        await renameFilesInZip(zipPath, outputDir,zipFile );
    }
}


// Example usage:
const zipPath = path.join(__dirname, '../input');
const outputDir = path.join(__dirname, '../output');
processZipFilesInDirectory(zipPath, outputDir).then(() => {
    console.log('Files renamed and saved successfully.');
}).catch(err => {
    console.error('Error processing files:', err);
});



