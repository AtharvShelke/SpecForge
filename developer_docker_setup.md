# Developer Guide: Setting up Docker on Windows

Since you are the developer, we need to ensure Docker is set up for high-performance development using the **WSL2** backend.

---

### Step 1: Check hardware settings (BIOS)
Docker needs "Virtualization" to be on.
1.  Open **Task Manager** (`Ctrl + Shift + Esc`).
2.  Go to the **Performance** tab -> **CPU**.
3.  Look at the bottom right. It should say **Virtualization: Enabled**.
    *   *If it says Disabled, you must restart and enable **SVM** or **VT-x** in your BIOS settings.*

---

### Step 2: Enable Windows Features
Open **PowerShell** as an Administrator and run this single command:
```powershell
wsl --install
```
*   This will enable the "Windows Subsystem for Linux" and download a default Ubuntu kernel.
*   **Restart your computer** immediately after this command finishes.

---

### Step 3: Install Docker Desktop
1.  Download the [Docker Desktop Installer](https://www.docker.com/products/docker-desktop/).
2.  Run the installer. **Crucial**: Make sure the box **"Use WSL 2 instead of Hyper-V"** is checked (it usually is by default).
3.  Once installed, open Docker Desktop. It may take a minute to start the "Engine" for the first time.

---

### Step 4: Configure for Development
1.  Open Docker Desktop Settings (the gear icon ⚙️).
2.  Go to **General** -> Ensure "Use the WSL 2 based engine" is checked.
3.  Go to **Resources** -> **WSL Integration** -> Turn it on for your default distro (e.g., Ubuntu).
4.  Click **Apply & Restart**.

---

### Step 5: Verification
Open your VS Code terminal or PowerShell and type:
```bash
docker --version
```
If you see a version number (e.g., `Docker version 24.x.x`), you are ready!

---

### How to test your App locally:
Now that you have Docker, you can test the production build I created:
1.  In your project folder, type:
    ```bash
    docker build -t test-app .
    ```
2.  Run it:
    ```bash
    docker run -p 3000:3000 test-app
    ```
3.  Go to `http://localhost:3000` in your browser. If you see your app, **congratulations!** It is now ready to be sent to the hangar and deployed to the client.
