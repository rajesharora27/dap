import { prisma } from './context';
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

    // Create Solution 1: Enterprise Security Bundle
    console.log('[seed-solutions] Creating Enterprise Security Bundle...');
    const securitySolution = await prisma.solution.findFirst({
      where: { name: 'Enterprise Security Bundle' }
    }) || await prisma.solution.create({
      data: {
        name: 'Enterprise Security Bundle',
        description: 'Comprehensive security solution combining firewall, MFA, and security monitoring',
        customAttrs: {
          type: 'security-package',
          pricing_model: 'subscription',
          duration_months: 12,
          support_level: 'premium',
          target_audience: 'enterprise',
          deployment: 'cloud-hybrid'
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

    // Create solution-specific outcomes
    const securityOutcome1 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: securitySolution.id,
          name: 'Complete Security Posture'
        }
      },
      update: {},
      create: {
        solutionId: securitySolution.id,
        name: 'Complete Security Posture',
        description: 'Achieve comprehensive security across all enterprise systems'
      }
    });

    const securityOutcome2 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: securitySolution.id,
          name: 'Compliance Achievement'
        }
      },
      update: {},
      create: {
        solutionId: securitySolution.id,
        name: 'Compliance Achievement',
        description: 'Meet SOC2, ISO27001, and industry regulatory requirements'
      }
    });

    // Create solution-specific licenses
    await prisma.license.upsert({
      where: {
        id: 'sec-sol-lic-ess'
      },
      update: {},
      create: {
        id: 'sec-sol-lic-ess',
        solutionId: securitySolution.id,
        name: 'Security Essential',
        description: 'Basic security features',
        level: 1,
        isActive: true
      }
    });

    await prisma.license.upsert({
      where: {
        id: 'sec-sol-lic-adv'
      },
      update: {},
      create: {
        id: 'sec-sol-lic-adv',
        solutionId: securitySolution.id,
        name: 'Security Advantage',
        description: 'Advanced security features with threat intelligence',
        level: 2,
        isActive: true
      }
    });

    // Create solution-specific releases
    const securityRelease = await prisma.release.upsert({
      where: {
        id: 'sec-sol-rel-1'
      },
      update: {},
      create: {
        id: 'sec-sol-rel-1',
        solutionId: securitySolution.id,
        name: 'Security Bundle v1.0',
        description: 'Initial security bundle release',
        level: 1.0,
        isActive: true
      }
    });

    // Create solution-specific tasks
    const securityTasks = [
      {
        name: 'Security Architecture Review',
        description: 'Comprehensive review of current security architecture and gap analysis',
        estMinutes: 480,
        weight: 10.0,
        sequenceNumber: 1,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.example.com/security-review'],
        howToVideo: ['https://video.example.com/security-review']
      },
      {
        name: 'Integration Testing',
        description: 'Test integration between all security components',
        estMinutes: 240,
        weight: 8.0,
        sequenceNumber: 2,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.example.com/integration-testing'],
        howToVideo: []
      },
      {
        name: 'Security Audit & Compliance Verification',
        description: 'Final security audit and compliance verification',
        estMinutes: 360,
        weight: 12.0,
        sequenceNumber: 3,
        licenseLevel: LicenseLevel.ADVANTAGE,
        howToDoc: ['https://docs.example.com/security-audit'],
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

    // Create Solution 2: Digital Transformation Package
    console.log('[seed-solutions] Creating Digital Transformation Package...');
    const digitalSolution = await prisma.solution.findFirst({
      where: { name: 'Digital Transformation Package' }
    }) || await prisma.solution.create({
      data: {
        name: 'Digital Transformation Package',
        description: 'Complete digital transformation solution with AI, analytics, and cloud migration',
        customAttrs: {
          type: 'transformation-package',
          pricing_model: 'milestone-based',
          duration_months: 18,
          support_level: 'enterprise',
          target_audience: 'large-enterprise',
          deployment: 'cloud-native'
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

    // Create outcomes for digital solution
    const digitalOutcome1 = await prisma.outcome.upsert({
      where: {
        solutionId_name: {
          solutionId: digitalSolution.id,
          name: 'Digital Excellence'
        }
      },
      update: {},
      create: {
        solutionId: digitalSolution.id,
        name: 'Digital Excellence',
        description: 'Achieve digital excellence with modern technology stack'
      }
    });

    // Create digital solution tasks
    const digitalTasks = [
      {
        name: 'Digital Readiness Assessment',
        description: 'Assess organization readiness for digital transformation',
        estMinutes: 600,
        weight: 15.0,
        sequenceNumber: 1,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.example.com/digital-assessment'],
        howToVideo: []
      },
      {
        name: 'Change Management Training',
        description: 'Train staff on new digital processes and tools',
        estMinutes: 720,
        weight: 20.0,
        sequenceNumber: 2,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.example.com/change-management'],
        howToVideo: ['https://video.example.com/training']
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
    }

    // Create test customers and assign solutions
    console.log('[seed-solutions] Creating test customers with solution assignments...');
    
    const customers = await prisma.customer.findMany({ take: 3 });
    
    if (customers.length > 0) {
      // Assign security solution to first customer
      const customerSolution1 = await prisma.customerSolution.upsert({
        where: {
          customerId_solutionId: {
            customerId: customers[0].id,
            solutionId: securitySolution.id
          }
        },
        update: {},
        create: {
          customerId: customers[0].id,
          solutionId: securitySolution.id,
          name: 'Production Security Bundle',
          licenseLevel: LicenseLevel.ADVANTAGE,
          selectedOutcomes: [securityOutcome1.id, securityOutcome2.id],
          selectedReleases: [securityRelease.id]
        }
      });

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
    console.log(`  - 2 Solutions (Security Bundle, Digital Transformation)`);
    console.log(`  - ${products.length} Products bundled`);
    console.log(`  - 5 Solution-specific tasks`);
    console.log(`  - 3 Solution outcomes`);
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

