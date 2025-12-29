import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSampleProduct() {
  console.log('🚀 Starting to seed comprehensive sample product...\n');

  try {
    // Check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: { name: 'Smart Laptop Pro' }
    });

    if (existingProduct) {
      console.log('⚠️  Smart Laptop Pro already exists. Deleting it first...');
      await prisma.product.delete({ where: { id: existingProduct.id } });
      console.log('✅ Deleted existing Smart Laptop Pro\n');
    }

    // Create the Smart Laptop Pro product
    console.log('📦 Creating Smart Laptop Pro product...');
    const product = await prisma.product.create({
      data: {
        name: 'Smart Laptop Pro',
        resources: [
          { label: 'Product Datasheet', url: 'https://example.com/datasheet' },
          { label: 'Getting Started Guide', url: 'https://example.com/guide' }
        ],
        customAttrs: {
          manufacturer: 'TechCorp',
          warrantyYears: '3',
          targetAudience: 'Professionals, Students, Content Creators',
          weight: '1.4 kg',
          screenSize: '14 inches',
          processor: 'Intel Core i7 / AMD Ryzen 7',
          memory: '16GB RAM (upgradable to 32GB)',
          storage: '512GB SSD',
          batteryLife: 'Up to 12 hours',
          connectivity: 'Wi-Fi 6E, Bluetooth 5.2, USB-C, HDMI',
          operatingSystem: 'Windows 11 Pro / macOS',
        }
      }
    });
    console.log(`✅ Created product: ${product.name} (ID: ${product.id})\n`);

    // Create Releases
    console.log('📋 Creating product releases/versions...');
    const releases = await Promise.all([
      prisma.release.create({
        data: {
          name: 'Version 1.0 (2023 Model)',
          level: 1.0,
          description: 'Initial release with base features',
          productId: product.id
        }
      }),
      prisma.release.create({
        data: {
          name: 'Version 2.0 (2024 Model)',
          level: 2.0,
          description: 'Enhanced performance and AI features',
          productId: product.id
        }
      }),
      prisma.release.create({
        data: {
          name: 'Version 2.5 (Mid-2024 Refresh)',
          level: 2.5,
          description: 'Improved battery life and thermal management',
          productId: product.id
        }
      }),
      prisma.release.create({
        data: {
          name: 'Version 3.0 (2025 Model)',
          level: 3.0,
          description: 'Next-gen processor and display technology',
          productId: product.id
        }
      })
    ]);
    console.log(`✅ Created ${releases.length} releases\n`);

    // Create Outcomes
    console.log('🎯 Creating business outcomes...');
    const outcomes = await Promise.all([
      prisma.outcome.create({
        data: {
          name: 'Productivity & Performance',
          description: 'Maximize user productivity with fast performance and efficient workflows',
          productId: product.id
        }
      }),
      prisma.outcome.create({
        data: {
          name: 'Security & Compliance',
          description: 'Ensure enterprise-grade security and regulatory compliance',
          productId: product.id
        }
      }),
      prisma.outcome.create({
        data: {
          name: 'User Experience & Satisfaction',
          description: 'Deliver exceptional user experience with intuitive interface and reliability',
          productId: product.id
        }
      }),
      prisma.outcome.create({
        data: {
          name: 'Cost Optimization',
          description: 'Reduce total cost of ownership through efficiency and longevity',
          productId: product.id
        }
      }),
      prisma.outcome.create({
        data: {
          name: 'Collaboration & Connectivity',
          description: 'Enable seamless collaboration and connectivity across teams',
          productId: product.id
        }
      })
    ]);
    console.log(`✅ Created ${outcomes.length} outcomes\n`);

    // Create comprehensive tasks with telemetry
    console.log('📝 Creating tasks with telemetry attributes...');

    // Task 1: Initial Setup
    const task1 = await prisma.task.create({
      data: {
        name: 'Complete Initial Device Setup',
        description: 'Unbox, power on, and complete the initial setup wizard including account creation and privacy settings',
        productId: product.id,
        estMinutes: 30,
        sequenceNumber: 1,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[2].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Setup Completed',
              description: 'Device setup wizard completed successfully',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Task succeeds when setup is completed'
              })
            },
            {
              name: 'Setup Time (minutes)',
              description: 'Time taken to complete initial setup',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'lessThan',
                threshold: 30,
                description: 'Setup should complete in under 30 minutes'
              })
            },
            {
              name: 'Account Type',
              description: 'Type of account created during setup',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Work Account',
                description: 'Should use work account for enterprise deployment'
              })
            }
          ]
        }
      }
    });

    // Task 2: Software Installation
    const task2 = await prisma.task.create({
      data: {
        name: 'Install Essential Software',
        description: 'Install productivity suite, security software, and collaboration tools',
        productId: product.id,
        estMinutes: 60,
        sequenceNumber: 2,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[0].id }, { outcomeId: outcomes[1].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'All Software Installed',
              description: 'All essential software packages installed',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'All required software must be installed'
              })
            },
            {
              name: 'Number of Apps Installed',
              description: 'Count of applications installed',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 10,
                description: 'Minimum 10 essential apps should be installed'
              })
            },
            {
              name: 'Antivirus Status',
              description: 'Status of antivirus protection',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Active and Updated',
                description: 'Antivirus must be active with latest definitions'
              })
            }
          ]
        }
      }
    });

    // Task 3: Security Configuration
    const task3 = await prisma.task.create({
      data: {
        name: 'Configure Security Settings',
        description: 'Enable firewall, encryption, biometric authentication, and automatic updates',
        productId: product.id,
        estMinutes: 45,
        sequenceNumber: 3,
        releases: { create: [releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[1].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Firewall Enabled',
              description: 'System firewall is enabled and active',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Firewall must be enabled'
              })
            },
            {
              name: 'Encryption Enabled',
              description: 'Full disk encryption is enabled',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Full disk encryption must be enabled'
              })
            },
            {
              name: 'Biometric Auth Enabled',
              description: 'Biometric authentication (fingerprint/face) is configured',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Biometric authentication should be enabled'
              })
            },
            {
              name: 'Security Score',
              description: 'Overall security posture score (0-100)',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 85,
                description: 'Security score should be 85 or higher'
              })
            }
          ]
        }
      }
    });

    // Task 4: Productivity Tools Setup
    const task4 = await prisma.task.create({
      data: {
        name: 'Set Up Productivity Tools',
        description: 'Configure email, calendar, task management, and document collaboration tools',
        productId: product.id,
        estMinutes: 45,
        sequenceNumber: 4,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[0].id }, { outcomeId: outcomes[4].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Email Configured',
              description: 'Email client configured and syncing',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Email must be configured'
              })
            },
            {
              name: 'Calendar Synced',
              description: 'Calendar synchronized with work account',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Calendar must be synced'
              })
            },
            {
              name: 'Emails Synced Count',
              description: 'Number of emails synchronized',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThan',
                threshold: 0,
                description: 'At least one email should be synced'
              })
            },
            {
              name: 'Sync Status',
              description: 'Current synchronization status',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Fully Synced',
                description: 'All data should be fully synchronized'
              })
            }
          ]
        }
      }
    });

    // Task 5: Network Configuration
    const task5 = await prisma.task.create({
      data: {
        name: 'Configure Network Settings',
        description: 'Connect to corporate Wi-Fi, VPN, and configure network security',
        productId: product.id,
        estMinutes: 30,
        sequenceNumber: 5,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[1].id }, { outcomeId: outcomes[4].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'WiFi Connected',
              description: 'Connected to corporate Wi-Fi network',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Must be connected to Wi-Fi'
              })
            },
            {
              name: 'VPN Configured',
              description: 'VPN client installed and configured',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'VPN must be configured for secure access'
              })
            },
            {
              name: 'Network Speed (Mbps)',
              description: 'Network download speed in Mbps',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 50,
                description: 'Network speed should be at least 50 Mbps'
              })
            },
            {
              name: 'Network Security Level',
              description: 'Network security configuration level',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Enterprise WPA3',
                description: 'Should use enterprise-grade security'
              })
            }
          ]
        }
      }
    });

    // Task 6: Performance Optimization
    const task6 = await prisma.task.create({
      data: {
        name: 'Optimize System Performance',
        description: 'Configure power settings, startup programs, and system optimization',
        productId: product.id,
        estMinutes: 30,
        sequenceNumber: 6,
        releases: { create: [releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[0].id }, { outcomeId: outcomes[3].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Fast Startup Enabled',
              description: 'Fast startup mode is enabled',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Fast startup should be enabled'
              })
            },
            {
              name: 'Boot Time (seconds)',
              description: 'Time to boot to desktop in seconds',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'lessThan',
                threshold: 30,
                description: 'Boot time should be under 30 seconds'
              })
            },
            {
              name: 'Startup Apps Count',
              description: 'Number of apps starting automatically',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'lessThanOrEqual',
                threshold: 10,
                description: 'Keep startup apps to 10 or fewer for optimal performance'
              })
            },
            {
              name: 'Performance Mode',
              description: 'Current power/performance mode',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'High Performance',
                description: 'Should be set to High Performance when plugged in'
              })
            }
          ]
        }
      }
    });

    // Task 7: Backup Configuration
    const task7 = await prisma.task.create({
      data: {
        name: 'Set Up Automated Backups',
        description: 'Configure cloud backup and local backup solutions',
        productId: product.id,
        estMinutes: 45,
        sequenceNumber: 7,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[1].id }, { outcomeId: outcomes[3].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Cloud Backup Enabled',
              description: 'Cloud backup is configured and running',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Cloud backup must be enabled'
              })
            },
            {
              name: 'Local Backup Enabled',
              description: 'Local/external drive backup is configured',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Local backup should be enabled as secondary backup'
              })
            },
            {
              name: 'Backup Frequency (hours)',
              description: 'Hours between automatic backups',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'lessThanOrEqual',
                threshold: 24,
                description: 'Backups should run at least daily'
              })
            },
            {
              name: 'Last Backup Status',
              description: 'Status of most recent backup',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Completed Successfully',
                description: 'Last backup should have completed successfully'
              })
            }
          ]
        }
      }
    });

    // Task 8: User Training
    const task8 = await prisma.task.create({
      data: {
        name: 'Complete User Training',
        description: 'Complete training modules on device features, security best practices, and productivity tools',
        productId: product.id,
        estMinutes: 120,
        sequenceNumber: 8,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[0].id }, { outcomeId: outcomes[1].id }, { outcomeId: outcomes[2].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Training Completed',
              description: 'All required training modules completed',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'User must complete all training modules'
              })
            },
            {
              name: 'Training Score (%)',
              description: 'Overall training assessment score',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 80,
                description: 'User should score 80% or higher on training assessment'
              })
            },
            {
              name: 'Modules Completed',
              description: 'Number of training modules completed',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 5,
                description: 'At least 5 modules should be completed'
              })
            },
            {
              name: 'Certification Status',
              description: 'User certification status',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Certified',
                description: 'User should be certified after completing training'
              })
            }
          ]
        }
      }
    });

    // Task 9: Hardware Health Check
    const task9 = await prisma.task.create({
      data: {
        name: 'Perform Hardware Health Check',
        description: 'Run diagnostics on battery, storage, memory, and other hardware components',
        productId: product.id,
        estMinutes: 30,
        sequenceNumber: 9,
        releases: { create: [releases[0].id, releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[2].id }, { outcomeId: outcomes[3].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Battery Health Good',
              description: 'Battery health status is good',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Battery health should be good'
              })
            },
            {
              name: 'Battery Capacity (%)',
              description: 'Current battery capacity as percentage of original',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 80,
                description: 'Battery capacity should be at least 80%'
              })
            },
            {
              name: 'Storage Available (GB)',
              description: 'Available storage space in gigabytes',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 100,
                description: 'At least 100GB should be available'
              })
            },
            {
              name: 'Overall Hardware Status',
              description: 'Overall hardware health status',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'Excellent',
                description: 'Hardware should be in excellent condition'
              })
            }
          ]
        }
      }
    });

    // Task 10: Collaboration Tools Integration
    const task10 = await prisma.task.create({
      data: {
        name: 'Integrate Collaboration Tools',
        description: 'Set up video conferencing, instant messaging, and file sharing platforms',
        productId: product.id,
        estMinutes: 60,
        sequenceNumber: 10,
        releases: { create: [releases[1].id, releases[2].id, releases[3].id].map(id => ({ releaseId: id })) },
        outcomes: { create: [{ outcomeId: outcomes[4].id }] },
        telemetryAttributes: {
          create: [
            {
              name: 'Video Conferencing Ready',
              description: 'Video conferencing tools installed and tested',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Video conferencing should be ready'
              })
            },
            {
              name: 'Messaging App Connected',
              description: 'Team messaging app connected and synced',
              dataType: 'BOOLEAN',
              successCriteria: JSON.stringify({
                type: 'boolean_flag',
                expectedValue: true,
                description: 'Messaging app must be connected'
              })
            },
            {
              name: 'Active Channels',
              description: 'Number of active collaboration channels',
              dataType: 'NUMBER',
              successCriteria: JSON.stringify({
                type: 'threshold',
                operator: 'greaterThanOrEqual',
                threshold: 3,
                description: 'At least 3 channels should be active'
              })
            },
            {
              name: 'Video Quality',
              description: 'Video conferencing quality setting',
              dataType: 'STRING',
              successCriteria: JSON.stringify({
                type: 'exact_match',
                expectedValue: 'HD 1080p',
                description: 'Video should be set to HD quality'
              })
            }
          ]
        }
      }
    });

    console.log(`✅ Created 10 comprehensive tasks with telemetry\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SAMPLE PRODUCT SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📦 Product: ${product.name}`);
    console.log(`   Resources: ${JSON.stringify(product.resources)}`);
    console.log(`\n📋 Created Resources:`);
    console.log(`   • ${releases.length} Releases (versions 1.0 to 3.0)`);
    console.log(`   • ${outcomes.length} Business Outcomes`);
    console.log(`   • 10 Tasks with comprehensive telemetry`);
    console.log(`   • ~40 Telemetry Attributes (boolean, number, string types)`);
    console.log(`\n🎯 Task Categories:`);
    console.log(`   • Onboarding`);
    console.log(`   • Configuration`);
    console.log(`   • Security`);
    console.log(`   • Optimization`);
    console.log(`   • Data Management`);
    console.log(`   • Training`);
    console.log(`   • Maintenance`);
    console.log(`   • Integration`);
    console.log(`\n💡 Use Cases:`);
    console.log(`   • Demo adoption workflows`);
    console.log(`   • Showcase telemetry tracking (boolean, number, string)`);
    console.log(`   • Demonstrate task-outcome mapping`);
    console.log(`   • Explain release-based feature availability`);
    console.log(`   • Training and presentations`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding sample product:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedSampleProduct()
  .then(() => {
    console.log('🎉 Sample product seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to seed sample product:', error);
    process.exit(1);
  });


