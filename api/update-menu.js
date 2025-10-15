// /api/update-menu.js

// This function will run on Vercel's servers, not in the browser.
export default async function handler(request, response) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { newContent } = request.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Gets the secret key from Vercel's vault

    // --- GitHub Repo Details (Corrected) ---
    const REPO_OWNER = 'Mahmoud-Walid1'; // Your correct GitHub username
    const REPO_NAME = 'Tikka_plate';   // Your correct repository name
    const FILE_PATH = 'index.html';    // The file we want to update

    if (!newContent) {
        return response.status(400).json({ success: false, message: 'No content provided.' });
    }
    if (!GITHUB_TOKEN) {
        return response.status(500).json({ success: false, message: 'GitHub token is not configured on Vercel.' });
    }

    const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    try {
        // 1. Get the current file to get its SHA (required for updating)
        const getFileResponse = await fetch(API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!getFileResponse.ok) {
            throw new Error('Could not fetch the current file from GitHub. Check repo details and token permissions.');
        }

        const fileData = await getFileResponse.json();
        const currentSha = fileData.sha;

        // 2. Update the file
        const updateResponse = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Update menu via admin panel',
                content: Buffer.from(newContent).toString('base64'), // Encode content to Base64
                sha: currentSha, // Provide the SHA of the old file
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
