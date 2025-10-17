# DAP Testing Access Instructions

## How to Access the DAP Testing Environment

Follow these simple steps to access the application for testing.

### Step 1: Update Your Hosts File

You need to add one line to your computer's hosts file so `dap.temp.io` resolves to our test server.

#### For Windows Users:

1. Click Start, type **Notepad**
2. **Right-click** on Notepad and select **Run as Administrator**
3. Click **File → Open**
4. Navigate to: `C:\Windows\System32\drivers\etc`
5. Change file type from "Text Documents" to **All Files**
6. Open the file named **hosts**
7. Add this line at the end:
   ```
   172.22.156.32    dap.temp.io
   ```
8. Save and close

#### For Mac Users:

1. Open **Terminal** (Applications → Utilities → Terminal)
2. Type:
   ```bash
   sudo nano /etc/hosts
   ```
3. Enter your password when prompted
4. Add this line at the end:
   ```
   172.22.156.32    dap.temp.io
   ```
5. Press `Ctrl+O` to save, then `Ctrl+X` to exit

#### For Linux Users:

1. Open a terminal
2. Type:
   ```bash
   sudo nano /etc/hosts
   ```
3. Enter your password when prompted
4. Add this line at the end:
   ```
   172.22.156.32    dap.temp.io
   ```
5. Press `Ctrl+O` to save, then `Ctrl+X` to exit

### Step 2: Access the Application

Open your web browser and go to:

```
http://dap.temp.io:5173
```

That's it! The application should load.

### Step 3: Login

Use these credentials:
- **Admin Access**: Authorization header: `admin`
- **User Access**: Authorization header: `user`

(The application uses header-based authentication)

## Troubleshooting

### Can't Access the Application?

**1. Check if dap.temp.io resolves correctly:**

Open Command Prompt (Windows) or Terminal (Mac/Linux) and type:
```bash
ping dap.temp.io
```

You should see: `Reply from 172.22.156.32`

If you see "could not find host", go back to Step 1 and verify the hosts file entry.

**2. Can the server be reached?**

Try accessing directly by IP:
```
http://172.22.156.32:5173
```

If this works but `dap.temp.io` doesn't, check your hosts file again.

**3. Check your firewall:**

Make sure your corporate/personal firewall isn't blocking:
- Port 5173 (Frontend)
- Port 4000 (Backend API)

**4. Still having issues?**

Contact the administrator with:
- Your operating system (Windows/Mac/Linux)
- Screenshot of any error messages
- Result of `ping dap.temp.io` command

## Features to Test

### Customer Adoption Planning
- Create customer adoption plans
- Sync with products
- View task sequences
- Test HowTo documentation links

### Product Management
- Create/edit products
- Manage licenses
- Configure outcomes and releases

### Task Management
- Create tasks with sequence numbers
- Edit task properties
- Delete tasks (watch auto-renumbering)
- Reorder tasks by changing sequence

### UI/UX Testing
- Check responsive design
- Test hover effects on task descriptions
- Verify icons are clickable
- Check product menu auto-expand

## Reporting Issues

When reporting bugs or issues, please include:
1. **Steps to reproduce** - What did you do?
2. **Expected result** - What should happen?
3. **Actual result** - What actually happened?
4. **Screenshots** - If applicable
5. **Browser** - Chrome, Firefox, Safari, Edge?
6. **Operating System** - Windows, Mac, Linux?

## Important Notes

⚠️ **This is a TESTING environment**
- Data may be reset periodically
- Don't enter sensitive/real data
- System may be restarted for updates
- Use HTTP (not HTTPS) for testing

✅ **What to focus on:**
- User interface responsiveness
- Feature functionality
- Any errors or unexpected behavior
- Performance issues

## Support

For technical support or questions:
- Email: [your-email]
- Slack: [your-channel]
- Create issue in: [issue-tracker]

---

**Testing Period:** [Start Date] to [End Date]
**Application Version:** 1.2.0
**Last Updated:** October 16, 2025
