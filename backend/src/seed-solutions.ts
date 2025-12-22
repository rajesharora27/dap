import { prisma } from './shared/graphql/context';
import { LicenseLevel, TaskSourceType } from '@prisma/client';

/**
 * Seed comprehensive solution data including:
 * - Solutions with products
 * - Solution-specific tasks, outcomes, licenses, releases
 * - Customer solution assignments
 * - Solution adoption plans
 */
export async function seedSolutions() {
  console.log('[seed-solutions] Starting solution data seeding...');

  try {
    // Get existing products to bundle into solutions
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        tasks: { where: { deletedAt: null } },
        outcomes: true,
        releases: true,
        licenses: true
      }
    });

    if (products.length < 2) {
      console.log('[seed-solutions] Not enough products to create solutions. Skipping...');
      return;
    }

    // Create Solution 1: Hybrid Private Access
    console.log('[seed-solutions] Creating Hybrid Private Access solution...');
    const securitySolution = await prisma.solution.findFirst({
      where: { name: 'Hybrid Private Access' }
    }) || await prisma.solution.create({
      data: {
        name: 'Hybrid Private Access',
        description: 'Comprehensive secure access solution combining ZTNA, MFA, and firewall protection for hybrid workforce',
        customAttrs: {
          type: 'security-bundle',
          target: 'hybrid-workforce',
          deployment: 'cloud-hybrid',
          duration_months: 12
        }
      }
    });

    // Add products to security solution (first 2 products)
    for (let i = 0; i < Math.min(2, products.length); i++) {
      await prisma.solutionProduct.upsert({
        where: {
          productId_solutionId: {
            productId: products[i].id,
            solutionId: securitySolution.id
          }
        },
        update: { order: i + 1 },
        create: {
          productId: products[i].id,
          solutionId: securitySolution.id,
          order: i + 1
        }
      });
    }

    // Create solution-specific outcomes for Hybrid Private Access
    const securityOutcome1 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: securitySolution.id,
          name: 'Secure Hybrid Work'
        }
      },
      update: {},
      create: {
        solutionId: securitySolution.id,
        name: 'Secure Hybrid Work',
        description: 'Enable secure access for hybrid workforce from any location'
      }
    });

    const securityOutcome2 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: securitySolution.id,
          name: 'Zero Trust Architecture'
        }
      },
      update: {},
      create: {
        solutionId: securitySolution.id,
        name: 'Zero Trust Architecture',
        description: 'Implement complete zero trust security framework'
      }
    });

    // Create solution-specific licenses for Hybrid Private Access
    await prisma.license.upsert({
      where: {
        id: 'hpa-sol-lic-ess'
      },
      update: {},
      create: {
        id: 'hpa-sol-lic-ess',
        solutionId: securitySolution.id,
        name: 'Hybrid Access Essential',
        description: 'Basic secure access features for hybrid work',
        level: 1,
        isActive: true
      }
    });

    await prisma.license.upsert({
      where: {
        id: 'hpa-sol-lic-adv'
      },
      update: {},
      create: {
        id: 'hpa-sol-lic-adv',
        solutionId: securitySolution.id,
        name: 'Hybrid Access Advantage',
        description: 'Advanced features with zero trust and threat protection',
        level: 2,
        isActive: true
      }
    });

    // Create solution-specific releases for Hybrid Private Access
    const securityRelease = await prisma.release.upsert({
      where: {
        unique_solution_release_level: {
          solutionId: securitySolution.id,
          level: 1.0
        }
      },
      update: {},
      create: {
        id: 'hpa-sol-rel-1',
        solutionId: securitySolution.id,
        name: 'Hybrid Private Access v1.0',
        description: 'Initial hybrid private access bundle release',
        level: 1.0,
        isActive: true
      }
    });

    // Create solution-specific tasks for Hybrid Private Access
    const securityTasks = [
      {
        name: 'Hybrid Work Security Assessment',
        description: 'Assess current hybrid work security posture and identify gaps',
        estMinutes: 480,
        weight: 10.0,
        sequenceNumber: 1,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.cisco.com/hybrid-assessment'],
        howToVideo: ['https://videos.cisco.com/security-assessment']
      },
      {
        name: 'Zero Trust Implementation',
        description: 'Implement zero trust framework across all access points',
        estMinutes: 600,
        weight: 15.0,
        sequenceNumber: 2,
        licenseLevel: LicenseLevel.ADVANTAGE,
        howToDoc: ['https://docs.cisco.com/zero-trust'],
        howToVideo: ['https://videos.cisco.com/zero-trust-impl']
      },
      {
        name: 'Integrated Security Testing',
        description: 'Test integration between Secure Access, Duo, and Firewall',
        estMinutes: 360,
        weight: 12.0,
        sequenceNumber: 3,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.cisco.com/integration-testing'],
        howToVideo: []
      }
    ];

    for (const taskData of securityTasks) {
      const task = await prisma.task.upsert({
        where: {
          unique_solution_sequence: {
            solutionId: securitySolution.id,
            sequenceNumber: taskData.sequenceNumber
          }
        },
        update: {},
        create: {
          ...taskData,
          solution: { connect: { id: securitySolution.id } }
        }
      });

      // Associate with outcomes
      await prisma.taskOutcome.upsert({
        where: {
          taskId_outcomeId: {
            taskId: task.id,
            outcomeId: securityOutcome1.id
          }
        },
        update: {},
        create: {
          taskId: task.id,
          outcomeId: securityOutcome1.id
        }
      });

      // Associate with releases
      await prisma.taskRelease.upsert({
        where: {
          taskId_releaseId: {
            taskId: task.id,
            releaseId: securityRelease.id
          }
        },
        update: {},
        create: {
          taskId: task.id,
          releaseId: securityRelease.id
        }
      });
    }

    // Create Solution 2: SASE
    console.log('[seed-solutions] Creating SASE solution...');
    const digitalSolution = await prisma.solution.findFirst({
      where: { name: 'SASE' }
    }) || await prisma.solution.create({
      data: {
        name: 'SASE',
        description: 'Complete SASE platform integrating SD-WAN, secure access, and multi-factor authentication',
        customAttrs: {
          type: 'sase-platform',
          target: 'distributed-enterprise',
          deployment: 'cloud-native',
          duration_months: 24
        }
      }
    });

    // Add remaining products to digital solution
    for (let i = 2; i < Math.min(5, products.length); i++) {
      await prisma.solutionProduct.upsert({
        where: {
          productId_solutionId: {
            productId: products[i].id,
            solutionId: digitalSolution.id
          }
        },
        update: { order: i - 1 },
        create: {
          productId: products[i].id,
          solutionId: digitalSolution.id,
          order: i - 1
        }
      });
    }

    // Create outcomes for SASE solution
    const digitalOutcome1 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: digitalSolution.id,
          name: 'Cloud-Native Network'
        }
      },
      update: {},
      create: {
        solutionId: digitalSolution.id,
        name: 'Cloud-Native Network',
        description: 'Modern cloud-first networking with integrated security'
      }
    });

    const digitalOutcome2 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: digitalSolution.id,
          name: 'Global Performance'
        }
      },
      update: {},
      create: {
        solutionId: digitalSolution.id,
        name: 'Global Performance',
        description: 'Optimized performance for distributed workforce'
      }
    });

    // Create SASE solution tasks
    const digitalTasks = [
      {
        name: 'SASE Architecture Design',
        description: 'Design comprehensive SASE architecture for distributed enterprise',
        estMinutes: 600,
        weight: 15.0,
        sequenceNumber: 1,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.cisco.com/sase-design'],
        howToVideo: ['https://videos.cisco.com/sase-architecture']
      },
      {
        name: 'Network Transformation',
        description: 'Transform traditional WAN to cloud-native SASE platform',
        estMinutes: 900,
        weight: 20.0,
        sequenceNumber: 2,
        licenseLevel: LicenseLevel.ADVANTAGE,
        howToDoc: ['https://docs.cisco.com/network-transformation'],
        howToVideo: ['https://videos.cisco.com/wan-to-sase']
      },
      {
        name: 'SASE Integration Validation',
        description: 'Validate integration between SD-WAN, Secure Access, and Duo',
        estMinutes: 480,
        weight: 12.0,
        sequenceNumber: 3,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.cisco.com/sase-validation'],
        howToVideo: []
      }
    ];

    for (const taskData of digitalTasks) {
      const task = await prisma.task.upsert({
        where: {
          unique_solution_sequence: {
            solutionId: digitalSolution.id,
            sequenceNumber: taskData.sequenceNumber
          }
        },
        update: {},
        create: {
          ...taskData,
          solution: { connect: { id: digitalSolution.id } }
        }
      });

      // Link to both outcomes
      await prisma.taskOutcome.upsert({
        where: {
          taskId_outcomeId: {
            taskId: task.id,
            outcomeId: digitalOutcome1.id
          }
        },
        update: {},
        create: {
          taskId: task.id,
          outcomeId: digitalOutcome1.id
        }
      });

      if (taskData.sequenceNumber === 2) {
        // Link transformation task to global performance outcome
        await prisma.taskOutcome.upsert({
          where: {
            taskId_outcomeId: {
              taskId: task.id,
              outcomeId: digitalOutcome2.id
            }
          },
          update: {},
          create: {
            taskId: task.id,
            outcomeId: digitalOutcome2.id
          }
        });
      }
    }

    // Create test customers and assign solutions
    console.log('[seed-solutions] Creating test customers with solution assignments...');

    const customers = await prisma.customer.findMany({ take: 3 });

    if (customers.length > 0) {
      // Assign SASE solution to first customer (Default Solution)
      const customerSolution1 = await prisma.customerSolution.upsert({
        where: {
          customerId_solutionId: {
            customerId: customers[0].id,
            solutionId: digitalSolution.id
          }
        },
        update: {},
        create: {
          customerId: customers[0].id,
          solutionId: digitalSolution.id,
          name: 'Global SASE Deployment',
          licenseLevel: LicenseLevel.ADVANTAGE,
          selectedOutcomes: [digitalOutcome1.id, digitalOutcome2.id],
          selectedReleases: []
        }
      });

      console.log('[seed-solutions] Created default customer solution assignment (SASE):', customerSolution1.id);

      // Assign Cisco Secure Access as standalone product (Default Product)
      const secureAccessProduct = await prisma.product.findUnique({
        where: { id: 'prod-cisco-secure-access-sample' }
      });

      if (secureAccessProduct) {
        // Find existing to determine if upsert is needed by name or just create if complex unique constraint
        // The unique constraint is [customerId, productId, name] or similar. We'll use findFirst to check.
        const existingCA = await prisma.customerProduct.findFirst({
          where: {
            customerId: customers[0].id,
            productId: secureAccessProduct.id,
            customerSolutionId: null // Ensure it's standalone
          }
        });

        if (!existingCA) {
          await prisma.customerProduct.create({
            data: {
              customerId: customers[0].id,
              productId: secureAccessProduct.id,
              name: 'Cisco Secure Access',
              licenseLevel: LicenseLevel.ESSENTIAL,
              customerSolutionId: null
            }
          });
          console.log('[seed-solutions] Created default standalone product assignment: Cisco Secure Access');
        } else {
          console.log('[seed-solutions] Cisco Secure Access already assigned as standalone product');
        }
      }

      console.log('[seed-solutions] Created customer solution assignment:', customerSolution1.id);

      // Optionally create adoption plan (commented out to avoid auto-creation)
      // This would be done through the UI in production
      /*
      const existingPlan = await prisma.solutionAdoptionPlan.findUnique({
        where: { customerSolutionId: customerSolution1.id }
      });

      if (!existingPlan) {
        console.log('[seed-solutions] Note: Adoption plan can be created via UI');
      }
      */
    }

    console.log('[seed-solutions] ✅ Solution seeding completed successfully!');
    console.log(`[seed-solutions] Created:`);
    console.log(`  - 2 Solutions (Hybrid Private Access, SASE)`);
    console.log(`  - ${products.length} Cisco Products bundled`);
    console.log(`  - 6 Solution-specific tasks`);
    console.log(`  - 4 Solution outcomes`);
    console.log(`  - 2 Solution licenses`);
    console.log(`  - Customer solution assignments`);

  } catch (error) {
    console.error('[seed-solutions] Error seeding solutions:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedSolutions()
    .then(() => {
      console.log('[seed-solutions] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[seed-solutions] Fatal error:', error);
      process.exit(1);
    });
}

