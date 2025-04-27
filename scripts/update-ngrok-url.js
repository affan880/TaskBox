const fs = require('fs');
const http = require('http');
const path = require('path');

const envFilePath = path.resolve(__dirname, '../.env'); // Assumes script is in 'scripts' folder
const ngrokApiUrl = 'http://localhost:4040/api/tunnels';
const variableName = 'BASE_URL';

console.log(`Attempting to update ${variableName} in ${envFilePath}`);

http.get(ngrokApiUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const tunnelsInfo = JSON.parse(data);
      // Find the HTTPS tunnel. Ngrok typically lists https first for http forwards.
      const httpsTunnel = tunnelsInfo.tunnels?.find(tunnel => tunnel.proto === 'https' && tunnel.config?.addr?.startsWith('http'));

      if (!httpsTunnel || !httpsTunnel.public_url) {
        console.error('❌ Error: Could not find an active ngrok HTTPS tunnel.');
        console.error('Ensure ngrok is running and forwarding an HTTP service.');
        process.exit(1);
      }

      const newUrl = httpsTunnel.public_url;
      console.log(`✅ Found ngrok HTTPS URL: ${newUrl}`);

      fs.readFile(envFilePath, 'utf8', (err, fileContent) => {
        if (err) {
          // If the file doesn't exist, create it with the BASE_URL
          if (err.code === 'ENOENT') {
            console.log(`📄 .env file not found. Creating it with ${variableName}=${newUrl}`);
            const newContent = `${variableName}=${newUrl}\n`;
            fs.writeFile(envFilePath, newContent, 'utf8', (writeErr) => {
              if (writeErr) {
                console.error(`❌ Error writing new .env file: ${writeErr}`);
                process.exit(1);
              }
              console.log(`✅ Successfully created ${envFilePath} and set ${variableName}.`);
            });
            return;
          }
          // Otherwise, it's some other read error
          console.error(`❌ Error reading .env file: ${err}`);
          process.exit(1);
        }

        const regex = new RegExp(`^${variableName}=.*`, 'm');
        let updatedContent;
        const newLine = `${variableName}=${newUrl}`;

        if (regex.test(fileContent)) {
          const existingLine = fileContent.match(regex)[0];
          if (existingLine === newLine) {
             console.log(`✅ ${variableName} is already up-to-date.`);
             return; // No need to write the same content
          }
          updatedContent = fileContent.replace(regex, newLine);
          console.log(`🔄 Replacing existing ${variableName}...`);
        } else {
           // Append if variable doesn't exist. Add newline if file not empty.
           updatedContent = fileContent.trim() + (fileContent.trim() ? '\n' : '') + newLine + '\n';
           console.log(`➕ Adding ${variableName} to .env file...`);
        }

        fs.writeFile(envFilePath, updatedContent, 'utf8', (writeErr) => {
          if (writeErr) {
            console.error(`❌ Error writing updated .env file: ${writeErr}`);
            process.exit(1);
          }
          console.log(`✅ Successfully updated ${variableName} in ${envFilePath}.`);
        });
      });

    } catch (parseError) {
      console.error(`❌ Error parsing ngrok API response: ${parseError}`);
      console.error('Is the ngrok agent running and the API accessible at http://localhost:4040?');
      process.exit(1);
    }
  });

}).on('error', (err) => {
  console.error(`❌ Error connecting to ngrok API (${ngrokApiUrl}): ${err.message}`);
  console.error('Is the ngrok agent running?');
  process.exit(1);
}); 