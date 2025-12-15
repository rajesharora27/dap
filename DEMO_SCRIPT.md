# DAP PoC - Live Demo Script

**Estimated Time:** 10-15 Minutes
**Prerequisites:** Ensure the application is running (`./dap start`) and you are logged in as an Admin (or appropriate role).

---

## 1. Introduction & Dashboard (1 Minute)
*   **Action:** Log in to the application.
*   **Talk Track:** "Here is the Digital Adoption Platform dashboard. As you can see, it provides a clean, modern interface for managing our three core entities: Products, Solutions, and Customers."
*   **Highlight:** Point out the Sidebar navigation and the distinct sections.

## 2. Product Management (3 Minutes)
*   **Action:** Navigate to **Products**. Select an existing product (e.g., "DAP Core" or create a dummy one if needed).
*   **Action:** Click on the **Tasks** tab/section.
*   **Talk Track:** "This is where Product Managers define the 'Gold Standard' for adoption. A Product is broken down into specific Tasks."
*   **Highlight:**
    *   **Task Details:** Open a task to show attributes like `Weight`, `Priority`, and `Estimated Time`.
    *   **Resources:** Point to the "How-to Doc" and "Video" links. "We embed enablement directly into the workflow."
    *   **Telemetry:** Switch to the Telemetry tab (if applicable). "We can define success criteria here, like 'Login Count > 5', which allows the system to auto-verify adoption."
*   **Action:** Briefly show the **Licenses** and **Outcomes** tabs to show how tasks are mapped to business value and sales tiers.

## 3. Customer Onboarding & Adoption Planning (4 Minutes)
*   **Action:** Navigate to **Customers**. Click **+ New Customer** (or select an existing one).
*   **Action:** Click **Assign Product/Solution**. Select the product you just showed.
*   **Action:** Choose a License Level (e.g., "Advantage").
*   **Talk Track:** "When a new customer signs up, we assign them the products they bought. Notice I selected the 'Advantage' license."
*   **Action:** Open the **Adoption Plan** for that customer.
*   **Highlight:** "The system automatically generated this plan. Crucially, it filtered out 'Signature' level tasks because this customer is on the 'Advantage' plan. This ensures CSMs focus only on what's relevant."
*   **Action:** Change a task status from **Not Started** to **In Progress**. Add a note.
*   **Talk Track:** "CSMs can track progress manually here, adding notes that are timestamped for audit trails."

## 4. Automation & Telemetry (2 Minutes)
*   **Talk Track:** "Manual tracking is good, but automation is better."
*   **Action:** (Simulated) "If we had live data flowing in, the system would compare real usage against our criteria."
*   **Action:** Click the **Re-evaluate** button (if available/visible).
*   **Talk Track:** "This button triggers the evaluation engine. If the telemetry data meets the criteria (e.g., user logged in 5 times), the task status automatically flips to 'Completed', saving the CSM time and ensuring accuracy."

## 5. Excel Import/Export (2 Minutes)
*   **Talk Track:** "We know people love Excel. We support full bulk-editing."
*   **Action:** Go back to the **Product** page. Click **Export Excel**.
*   **Action:** Open the downloaded file (if screen sharing allows, otherwise describe).
*   **Talk Track:** "I can modify weights, add 50 new tasks, or update descriptions in bulk here."
*   **Action:** (Optional) Make a small change in Excel, save, and **Import** it back to show the update reflecting instantly.

## 6. AI Assistant (1 Minute)
*   **Action:** Open the AI Assistant (if there's a chat interface or similar).
*   **Action:** Ask a question: "Show me all products with 'Analytics' tasks" or "Go to Customer X".
*   **Talk Track:** "We've also integrated an AI agent to help navigate the system and retrieve information quickly, making it easier for new users to get up to speed."

## 7. Conclusion
*   **Talk Track:** "That concludes the demo. We went from defining a product to onboarding a customer and tracking their success, all in a structured, automated way."
