// Knowledge Base Service
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

class KnowledgeBaseService {
  constructor() {
    this.openWebUIBaseURL = process.env.OPENWEBUI_API_BASE || 'http://open-webui:8080';
    this.apiKey = process.env.OPENWEBUI_API_KEY || '0p3n-w3bu!';
  }

  /**
   * Check if user message is requesting author creation
   */
  shouldSaveAuthor(message) {
    const patterns = [
      /create\s+(.*?)\s+author\s+for\s+/i,
      /generate\s+(.*?)\s+author\s+for\s+/i,
      /make\s+(.*?)\s+author\s+for\s+/i,
      // Handle format: "create author for [genre] for [collection]"
      /create\s+author\s+for\s+/i,
      /generate\s+author\s+for\s+/i,
      /make\s+author\s+for\s+/i
    ];
    
    return patterns.some(pattern => pattern.test(message));
  }

  /**
   * Extract genre and collection from user message
   */
  extractAuthorInfo(message) {
    // Pattern 1: "create [genre] author for [collection]"
    const pattern1 = /(?:create|generate|make)\s+(?:a\s+|an\s+)?(.*?)\s+author\s+for\s+['"]?([^'"]+)['"]?/i;
    const match1 = message.match(pattern1);
    
    if (match1) {
      let genre = match1[1].trim();
      const collection = match1[2].trim();
      
      // Clean up genre (remove 'a' or 'an' if present)
      genre = genre.replace(/^(a|an)\s+/i, '').trim();
      
      return {
        genre: genre,
        collection: collection,
        detected: true
      };
    }
    
    // Pattern 2: "create author for [genre] for [collection]" 
    const pattern2 = /(?:create|generate|make)\s+author\s+for\s+(?:the\s+)?(.*?)\s+(?:genre\s+)?for\s+(?:the\s+)?['"]?([^'"]+)['"]?\s*(?:collection)?/i;
    const match2 = message.match(pattern2);
    
    if (match2) {
      let genre = match2[1].trim();
      let collection = match2[2].trim();
      
      // Clean up genre (remove 'a' or 'an' if present)
      genre = genre.replace(/^(a|an)\s+/i, '').trim();
      
      // Clean up collection (remove 'collection' word if present)
      collection = collection.replace(/\s+collection$/i, '').trim();
      
      return {
        genre: genre,
        collection: collection,
        detected: true
      };
    }
    
    return { detected: false };
  }

  /**
   * Get knowledge collections
   */
  async getKnowledgeCollections() {
    try {
      const response = await axios.get(`${this.openWebUIBaseURL}/api/v1/knowledge/`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      global.logger?.error('Failed to get knowledge collections:', {
        message: error.message,
        status: error.response?.status
      });
      return [];
    }
  }

  /**
   * Find or create knowledge collection by name
   */
  async findKnowledgeCollection(collectionName) {
    const collections = await this.getKnowledgeCollections();
    
    // Try to find existing collection by name (case insensitive)
    let collection = collections.find(c => 
      c.name.toLowerCase() === collectionName.toLowerCase()
    );
    
    if (collection) {
      global.logger?.info('Found existing knowledge collection', {
        name: collection.name,
        id: collection.id
      });
      return collection;
    }

    // For MVP, use the first available collection if specific one not found
    if (collections.length > 0) {
      collection = collections[0];
      global.logger?.info('Using first available knowledge collection', {
        name: collection.name,
        id: collection.id,
        requested: collectionName
      });
      return collection;
    }

    global.logger?.warn('No knowledge collections found');
    return null;
  }

  /**
   * Find existing file in knowledge collection by filename
   */
  async findExistingFile(knowledgeCollection, filename) {
    try {
      const response = await axios.get(`${this.openWebUIBaseURL}/api/v1/knowledge/${knowledgeCollection.id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const collectionData = response.data;
      if (!collectionData.files) {
        return null;
      }
      
      // Find file with matching name
      const existingFile = collectionData.files.find(file => 
        file.meta.name === filename
      );
      
      if (existingFile) {
        global.logger?.info('Found existing file', {
          filename,
          fileId: existingFile.id,
          size: existingFile.meta.size
        });
        return existingFile;
      }
      
      return null;
    } catch (error) {
      global.logger?.error('Failed to find existing file:', {
        message: error.message,
        status: error.response?.status,
        filename
      });
      return null;
    }
  }

  /**
   * Get file content by file ID
   */
  async getFileContent(fileId) {
    try {
      const response = await axios.get(`${this.openWebUIBaseURL}/api/v1/files/${fileId}/content`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.data;
    } catch (error) {
      global.logger?.error('Failed to get file content:', {
        message: error.message,
        status: error.response?.status,
        fileId
      });
      return null;
    }
  }

  /**
   * Remove file from knowledge collection
   */
  async removeFileFromKnowledge(knowledgeId, fileId) {
    try {
      const response = await axios.post(
        `${this.openWebUIBaseURL}/api/v1/knowledge/${knowledgeId}/file/remove`,
        { file_id: fileId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      global.logger?.error('Failed to remove file from knowledge collection:', {
        message: error.message,
        status: error.response?.status,
        knowledgeId,
        fileId
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Append new content to existing content with proper formatting
   */
  appendContent(existingContent, newContent) {
    // Clean up existing content (remove any trailing whitespace)
    const cleanExisting = existingContent.trim();
    const cleanNew = newContent.trim();
    
    // Add separator and new content
    return `${cleanExisting}\n\n---\n\n${cleanNew}`;
  }

  /**
   * Add file to knowledge collection
   */
  async addFileToKnowledge(knowledgeId, fileId) {
    try {
      const response = await axios.post(
        `${this.openWebUIBaseURL}/api/v1/knowledge/${knowledgeId}/file/add`,
        { file_id: fileId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      global.logger?.error('Failed to add file to knowledge collection:', {
        message: error.message,
        status: error.response?.status,
        knowledgeId,
        fileId
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Save content to Open WebUI knowledge base
   */
  async saveToKnowledgeBase(title, content, collection) {
    try {
      // Step 1: Find or get the knowledge collection
      const knowledgeCollection = await this.findKnowledgeCollection(collection);
      if (!knowledgeCollection) {
        return {
          success: false,
          message: 'No knowledge collections available'
        };
      }

      const filename = `${title}.txt`;
      let finalContent = content;
      let existingFile = null;

      // Step 2: Check if file already exists
      existingFile = await this.findExistingFile(knowledgeCollection, filename);
      
      if (existingFile) {
        global.logger?.info('File exists, preparing to append content', {
          filename,
          existingFileId: existingFile.id
        });
        
        // Get existing content
        const existingContent = await this.getFileContent(existingFile.id);
        if (existingContent) {
          // Append new content to existing content
          finalContent = this.appendContent(existingContent, content);
          global.logger?.info('Content appended', {
            originalLength: existingContent.length,
            newLength: finalContent.length
          });
          
          // Remove existing file from collection (we'll upload a new version)
          await this.removeFileFromKnowledge(knowledgeCollection.id, existingFile.id);
        }
      }

      // Step 3: Create temporary file with final content
      const tempFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
      const tempPath = path.join(os.tmpdir(), tempFilename);
      
      await writeFile(tempPath, finalContent, 'utf8');
      
      // Step 4: Upload file to Open WebUI
      const formData = new FormData();
      const fileStream = fs.createReadStream(tempPath);
      formData.append('file', fileStream, filename);
      
      const action = existingFile ? 'Appending to existing file' : 'Creating new file';
      global.logger?.info(`${action} in Open WebUI`, {
        url: `${this.openWebUIBaseURL}/api/v1/files/`,
        filename,
        targetCollection: knowledgeCollection.name,
        contentLength: finalContent.length
      });
      
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...formData.getHeaders()
      };
      
      const uploadResponse = await axios.post(
        `${this.openWebUIBaseURL}/api/v1/files/`,
        formData,
        {
          headers,
          timeout: 30000
        }
      );

      // Clean up temp file
      await unlink(tempPath);

      if (uploadResponse.status === 200) {
        const fileData = uploadResponse.data;
        const fileId = fileData.id;
        
        global.logger?.info('File uploaded successfully', {
          fileId,
          title
        });
        
        // Step 5: Add file to knowledge collection
        const addResult = await this.addFileToKnowledge(knowledgeCollection.id, fileId);
        
        if (addResult.success) {
          const actionMessage = existingFile ? 'appended to existing file in' : 'saved to';
          global.logger?.info('File added to knowledge collection successfully', {
            fileId,
            title,
            collection: knowledgeCollection.name,
            knowledgeId: knowledgeCollection.id,
            wasAppended: !!existingFile
          });
          
          return {
            success: true,
            fileId,
            knowledgeId: knowledgeCollection.id,
            message: `Content ${actionMessage} ${knowledgeCollection.name} collection`,
            wasAppended: !!existingFile
          };
        } else {
          global.logger?.error('Failed to add file to knowledge collection', addResult);
          return {
            success: false,
            message: `File uploaded but failed to add to ${knowledgeCollection.name} collection`
          };
        }
      } else {
        global.logger?.error('File upload failed', {
          status: uploadResponse.status,
          data: uploadResponse.data
        });
        return {
          success: false,
          message: 'Failed to upload to knowledge base'
        };
      }

    } catch (error) {
      global.logger?.error('Knowledge base save error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      return {
        success: false,
        message: 'Error saving to knowledge base'
      };
    }
  }

  /**
   * Process user message and save if author creation detected
   */
  async processMessage(userMessage, modelResponse) {
    if (!this.shouldSaveAuthor(userMessage)) {
      return { shouldSave: false };
    }

    const authorInfo = this.extractAuthorInfo(userMessage);
    if (!authorInfo.detected) {
      return { shouldSave: false };
    }

    global.logger?.info('Author creation detected', authorInfo);

    const title = `${authorInfo.genre.charAt(0).toUpperCase() + authorInfo.genre.slice(1)} Author Profile`;
    const result = await this.saveToKnowledgeBase(title, modelResponse, authorInfo.collection);

    return {
      shouldSave: true,
      authorInfo,
      saveResult: result
    };
  }
}

module.exports = new KnowledgeBaseService();