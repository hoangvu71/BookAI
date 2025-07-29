// Supabase Configuration for BookAI
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Database table configurations for Open WebUI integration
const TABLES = {
  USERS: 'users',
  CHATS: 'chats', 
  MESSAGES: 'messages',
  DOCUMENTS: 'documents',
  MODELS: 'models',
  PROMPTS: 'prompts',
  TOOLS: 'tools',
  TAGS: 'tags',
  SESSIONS: 'sessions'
};

// Database helper functions
const db = {
  // User management
  async createUser(userData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert(userData)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getUserById(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Chat management
  async createChat(chatData) {
    const { data, error } = await supabase
      .from(TABLES.CHATS)
      .insert(chatData)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getChatsByUserId(userId) {
    const { data, error } = await supabase
      .from(TABLES.CHATS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getChatById(chatId) {
    const { data, error } = await supabase
      .from(TABLES.CHATS)
      .select('*')
      .eq('id', chatId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Message management
  async createMessage(messageData) {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .insert(messageData)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getMessagesByChatId(chatId) {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Document management (for RAG)
  async uploadDocument(documentData) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .insert(documentData)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getDocumentsByUserId(userId) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Session management
  async createSession(sessionData) {
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .insert(sessionData)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getSession(sessionId) {
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async deleteSession(sessionId) {
    const { error } = await supabase
      .from(TABLES.SESSIONS)
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
  }
};

module.exports = {
  supabase,
  db,
  TABLES
};