#!/usr/bin/env node
// Quick verification script to check if GUI-created tasks persist

const { execSync } = require('child_process');

async function setupFetch() {
  try {
    const fetch = await import('node-fetch');
    global.fetch = fetch.default;
  } catch (error) {
    global.fetch = async (url, options = {}) => {
      const curlCommand = `curl -s -X ${options.method || 'GET'} ` +
        `-H "Content-Type: application/json" ` +
        (options.body ? `-d '${options.body}'` : '') +
        ` "${url}"`;
      
      try {
        const result = execSync(curlCommand, { encoding: 'utf8' });
        return {
          ok: true,
          json: async () => JSON.parse(result)
        };
      } catch (error) {
        return {
          ok: false,
          json: async () => ({ errors: [{ message: error.message }] })
        };
      }
    };
  }
}

async function checkForGUITask() {
  console.log('🔍 Checking for GUI-created task...');
  
  const query = `
    query GetTestProduct {
      product(id: "cmg5n0r2s000gk101hi3oiswr") {
        id
        name
        tasks(first: 10) {
          edges {
            node {
              id
              name
              description
              notes
              howToDoc
              howToVideo
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    const tasks = result.data?.product?.tasks?.edges?.map(e => e.node) || [];
    
    console.log(`📋 Found ${tasks.length} tasks in test product:`);
    
    tasks.forEach(task => {
      console.log(`\n📄 Task: ${task.name}`);
      console.log(`   📝 Notes: "${task.notes || 'NONE'}"`);
      console.log(`   📚 HowToDoc: "${task.howToDoc || 'NONE'}"`);
      console.log(`   🎥 HowToVideo: "${task.howToVideo || 'NONE'}"`);
      
      if (task.name.includes('GUI Test')) {
        console.log('   🎯 ← This is the GUI-created task!');
        if (!task.howToDoc || !task.howToVideo) {
          console.log('   ❌ Missing howToDoc or howToVideo!');
        } else {
          console.log('   ✅ Has both howToDoc and howToVideo!');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking tasks:', error.message);
  }
}

setupFetch().then(checkForGUITask);