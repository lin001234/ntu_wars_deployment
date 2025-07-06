const { supabaseAdmin } = require('../config/supabase');

async function createTables() {
  try {
    console.log('Creating users table in Supabase...');
    
    // Create users table using SQL
    const { data, error } = await supabaseAdmin.rpc('create_users_table');
    
    if (error) {
      // If the RPC doesn't exist, create table directly with SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          provider VARCHAR(50) NOT NULL,
          provider_id VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          avatar TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(provider, provider_id)
        );
        
        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        
        -- Create RLS policies (optional, for additional security)
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Policy to allow users to read their own data
        CREATE POLICY "Users can view own profile" ON users
          FOR SELECT USING (auth.uid()::text = id::text);
          
        -- Policy to allow service role to manage all users
        CREATE POLICY "Service role can manage users" ON users
          FOR ALL USING (auth.role() = 'service_role');
      `;
      
      // Execute the SQL directly
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
        sql: createTableSQL
      });
      
      if (sqlError) {
        console.log('Direct SQL execution failed, table might already exist or need manual creation');
        console.log('Please create the table manually in your Supabase dashboard:');
        console.log(createTableSQL);
      } else {
        console.log('Users table and policies created successfully');
      }
    } else {
      console.log('Users table created successfully via RPC');
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
    console.log('\n=== MANUAL SETUP REQUIRED ===');
    console.log('Please run this SQL in your Supabase SQL editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for security
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);
    `);
  }
}

// Alternative function to create table with direct Supabase client
async function createTablesAlternative() {
  try {
    console.log('Setting up Supabase database schema...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (testError && testError.code === '42P01') {
      console.log('Users table does not exist. Please create it manually in Supabase dashboard.');
      console.log('Use the SQL provided above.');
    } else if (testError) {
      console.error('Database connection error:', testError);
    } else {
      console.log('Users table already exists and is accessible');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Run the setup
createTables().then(() => {
  console.log('Database setup completed');
  process.exit(0);
}).catch((error) => {
  console.error('Database setup failed:', error);
  createTablesAlternative();
  process.exit(1);
});
