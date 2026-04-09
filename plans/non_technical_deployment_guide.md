# The "Hands-Off" Deployment Guide (Windows + Auto-Updates)

This guide is for a **zero-maintenance** setup. Once finished, the app will update itself automatically whenever the developer pushes new code. No GitHub login or manual code management is required on this machine.

---

### Phase 1: Setup the "Engine"
1.  **Turn on Linux Mode**:
    *   Open your Start menu, type **PowerShell**, right-click it, and select **Run as Administrator**.
    *   Type this command and press Enter: `wsl --install`
    *   **Wait** for it to finish and then **Restart your PC**.
2.  **Install the Dashboard (Docker Desktop)**:
    *   Download and install from [Docker's Website](https://www.docker.com/products/docker-desktop/).
    *   Open it and log in with the **Deployment Account** provided by your developer. This allows the computer to pull the app securely.

---

### Phase 2: The "Magic" Launch
The developer will provide you with a folder containing a single file: `docker-compose.yml`.

1.  **Open the Folder**: Go to the folder on your `C:` drive (e.g., `C:\Deployment\md_client`).
2.  **Launch the System**:
    *   Hold **Shift** and Right-click the empty space in the folder.
    *   Select **"Open PowerShell window here"**.
    *   Type: `docker compose up -d`
3.  **You are Done!**: Your app is now running. You can verify this by opening Docker Desktop; you should see your project with a green light.

---

### Phase 3: How Automatic Updates Work
We have included a helper called **Watchtower** in the setup. 
*   **No Manual Work**: Every 5 minutes, Watchtower checks the "Hangar" (Docker Hub) for updates.
*   **Instant Update**: If the developer pushes a new version, Watchtower will automatically swap the old version for the new one.
*   **Always On**: As long as the PC is on and Docker is running, your website will stay updated.

---

### Phase 4: Custom Domain
1.  **Install Cloudflare**: Download and install `cloudflared-windows-amd64.msi`.
2.  **Connect**: Open PowerShell and run the specific `service install` command provided by the developer to link your custom domain.

---

### Maintenance Tips
*   **Power**: Ensure the PC is set to **"Never Sleep"** in Windows Settings. If the PC sleeps, the website goes down.
*   **Backups**: The developer handles the database structure; you just need to keep the machine running.
*   **Status**: If you want to check if the site is healthy, just look at the **Docker Desktop** app. If the light is **Green**, everything is perfect.

**Success!** Your server is now a fully automated hosting platform.
