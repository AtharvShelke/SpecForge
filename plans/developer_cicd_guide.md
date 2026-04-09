# Developer Guide: Setting up the "Hangar" (CI/CD)

Follow these steps on your PC and your GitHub account to enable automatic updates for the client.

---

### Step 1: Prepare the Hangar (Docker Hub)
1.  Go to [Docker Hub](https://hub.docker.com/) and sign up/log in.
2.  Click **Create Repository**.
3.  Name it `md_client`.
4.  **Important**: Set it to **Private** (so only you and the client's PC can see the code).
5.  Go to **Account Settings** -> **Security** -> **New Access Token**.
    *   Name it: `github-deployment`
    *   **Copy the token!** You will never see it again.

---

### Step 2: Configure GitHub Secrets
Go to your project on GitHub:
1.  Go to **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **New repository secret** and add these two:
    *   `DOCKERHUB_USERNAME`: (Your Docker Hub username)
    *   `DOCKERHUB_TOKEN`: (The token you just copied)

---

### Step 3: Create the Automator (GitHub Action)
Create a folder named `.github/workflows` in your project root and create a file named `deploy.yml` inside it:

```yaml
name: Build and Push to Hangar

on:
  push:
    branches: [ main ]  # Runs every time you push to the 'main' branch

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/md_client:latest
```

---

### Step 4: The First Upload
To start things off manually from your PC (optional):
1.  Open your project terminal.
2.  `docker build -t [your-username]/md_client:latest .`
3.  `docker push [your-username]/md_client:latest`

---

### Step 5: Final Hand-off to Client
Now, you only need to send the client **one file**: `docker-compose.yml`.

**File: docker-compose.yml**
```yaml
services:
  app:
    image: [your-username]/md_client:latest
    restart: always
    ports:
      - "3000:3000"
    env_file: .env   # They keep their own .env on their PC

  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
    restart: always
```

**Every time you push code to GitHub, the client's PC will notice and update itself within 5 minutes.**
