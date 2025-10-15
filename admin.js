// /api/update-menu.js
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { newContent, newImage } = request.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'Mahmoud-Walid1';
    const REPO_NAME = 'Tikka_plate';
    const FILE_PATH = 'index.html';

    if (!GITHUB_TOKEN) {
        return response.status(500).json({ success: false, message: 'GitHub token is not configured on Vercel.' });
    }

    try {
        // --- Step 1: Upload the new image if it exists ---
        if (newImage && newImage.name && newImage.content) {
            const IMAGE_PATH = `images/${newImage.name}`;
            const imageApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${IMAGE_PATH}`;
            
            await fetch(imageApiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Upload new image: ${newImage.name}`,
                    content: newImage.content, // content is already base64
                }),
            });
        }

        // --- Step 2: Update the index.html file ---
        const htmlApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        
        // Get SHA of the current index.html
        const getFileResponse = await fetch(htmlApiUrl, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' },
        });
        if (!getFileResponse.ok) throw new Error('Could not fetch index.html from GitHub.');
        const fileData = await getFileResponse.json();
        const currentSha = fileData.sha;

        // Update index.html
        const updateResponse = await fetch(htmlApiUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Update menu via admin panel',
                content: Buffer.from(newContent).toString('base64'),
                sha: currentSha,
            }),
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`GitHub API Error: ${errorData.message}`);
        }

        return response.status(200).json({ success: true, message: 'Menu updated successfully!' });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ success: false, message: error.message });
    }
}
