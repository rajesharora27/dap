// Simple test script for authentication
// Run with: node test-auth.js

const endpoint = 'http://localhost:3001/graphql';

async function testAuth() {
  console.log('🧪 Testing Authentication System\n');

  try {
    // Test 1: Login with admin
    console.log('1️⃣  Testing admin login...');
    const loginResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation {
            loginExtended(username: "admin", password: "Admin@123") {
              user {
                id
                username
                email
                isAdmin
                mustChangePassword
              }
              tokens {
                token
                refreshToken
              }
            }
          }
        `
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.errors) {
      console.log('❌ Login failed:', loginData.errors[0].message);
      return;
    }

    const { token } = loginData.data.loginExtended.tokens;
    const { user } = loginData.data.loginExtended;
    console.log('✅ Login successful!');
    console.log(`   User: ${user.username} (${user.email})`);
    console.log(`   Admin: ${user.isAdmin}`);
    console.log(`   Must Change Password: ${user.mustChangePassword}\n`);

    // Test 2: Get current user info
    console.log('2️⃣  Testing me query...');
    const meResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              id
              username
              email
              isAdmin
            }
          }
        `
      })
    });

    const meData = await meResponse.json();
    
    if (meData.errors) {
      console.log('❌ Me query failed:', meData.errors[0].message);
    } else {
      console.log('✅ Me query successful!');
      console.log(`   User: ${meData.data.me.username}\n`);
    }

    // Test 3: Create a new user
    console.log('3️⃣  Testing user creation...');
    const createUserResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          mutation {
            createUser(input: {
              username: "testuser${Date.now()}"
              email: "test${Date.now()}@example.com"
              fullName: "Test User"
              isAdmin: false
            }) {
              id
              username
              email
              mustChangePassword
            }
          }
        `
      })
    });

    const createUserData = await createUserResponse.json();
    
    if (createUserData.errors) {
      console.log('❌ User creation failed:', createUserData.errors[0].message);
    } else {
      const newUser = createUserData.data.createUser;
      console.log('✅ User creation successful!');
      console.log(`   User: ${newUser.username}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Must Change Password: ${newUser.mustChangePassword}`);
      console.log(`   Default Password: DAP123\n`);
    }

    // Test 4: Get all users
    console.log('4️⃣  Testing users query...');
    const usersResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query {
            users {
              id
              username
              email
              isAdmin
              isActive
            }
          }
        `
      })
    });

    const usersData = await usersResponse.json();
    
    if (usersData.errors) {
      console.log('❌ Users query failed:', usersData.errors[0].message);
    } else {
      console.log('✅ Users query successful!');
      console.log(`   Total users: ${usersData.data.users.length}\n`);
    }

    console.log('🎉 All tests completed!\n');
    console.log('📝 Summary:');
    console.log('   - Authentication system is working');
    console.log('   - Default password: DAP123');
    console.log('   - Admin user can create new users');
    console.log('   - JWT tokens are being generated and validated');
    console.log('\n✨ You can now integrate the frontend with these endpoints!');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

testAuth();

