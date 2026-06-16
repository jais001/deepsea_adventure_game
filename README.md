# Rea’s Deep Sea Journey 🌊🐠

Welcome to **Rea’s Deep Sea Journey**! This is a beautiful, highly responsive, arcade-style undersea adventure game built with React, TypeScript, Vite, and Tailwind CSS. Help **Rea**, an adventurous tiny fish, navigate through treacherous ocean currents, beautiful but branching coral reefs, heavy falling rocks, moving jellyfish columns, and deep sea mines.

In this update, **Permadeath Undercurrent Mode** is active: if Rea fails or crashes, her unlocked paths are reset, requiring a fresh start from Depth 01. Additionally, **Golden Bubble Shields** are triggered automatically upon colliding with glowing green marine pellets!

---

## 🎮 Game Controls & Mechanics

- **Swim Upward**: Tap your screen, click anywhere on the canvas, or press the **Spacebar** / **Up Arrow** key to flap Rea’s fins and swim upward. Gravity and sea drag will pull her down continuously.
- **Auto Golden Shield**: Keep an eye out for glowing green food pellets! Colliding with a pellet triggers an instantaneous **4.0-second Golden Shield**, allowing Rea to smash right through any subsea structures or jellyfish without taking damage.
- **Undercurrent Danger**: Swim all the way to 100% progress to complete a depth. Watch out in Depths 5 and 7—vicious shifting horizontal currents sway Rea dynamically!
- **Permadeath**: Each level gives you **3 Lives**. Failing any depth will reset your unlocked progress back to Depth 01!

---

## 🛠️ System Requirements

Before running the game locally, ensure you have the following installed on your machine:

- **Node.js**: Version `18.x` or higher (Recommended: `20.x` LTS)
- **npm**: (Comes bundled with Node.js) or **yarn** / **pnpm**
- **Git**: To clone the repository

---

## 🚀 Step-by-Step Installation & Setup

Choose your operating system below to set up and run the game.

### 🪟 On a Fresh Windows Machine

#### Step 1: Install Git & Node.js
1. Download and install **Git for Windows** from [git-scm.com](https://git-scm.com/). Follow the default wizard setup.
2. Download and install **Node.js** (LTS recommend version) from [nodejs.org](https://nodejs.org/). Make sure the checkbox `"Automatically install the necessary tools..."` or adding Node to PATH is enabled.

#### Step 2: Open Command Prompt or PowerShell
Press `Win + R`, type `cmd` or `powershell`, and run it. Verify installations:
```bash
node -v
npm -v
git --version
```

#### Step 3: Clone the Repository & Run
```bash
# Clone this repository
git clone <repository-url-here>
cd <repository-folder-name>

# Install packages & dependencies
npm install

# Start the local development server
npm run dev
```
Once started, open your browser and navigate to `http://localhost:3000`.

---

### 🐧 On a Fresh Linux Machine (Debian / Ubuntu / Linux Mint)

#### Step 1: Update Packages & Install Git
Open your Terminal and run:
```bash
sudo apt update
sudo apt install -y git curl
```

#### Step 2: Install Node.js (via NodeSource)
Using the recommended Node.js LTS (v20):
```bash
# Download and import the NodeSource GPG key and register repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs
```
Verify the installation:
```bash
node -v
npm -v
```

#### Step 3: Clone, Setup, and Run the Game
```bash
# Clone the repository
git clone <repository-url-here>
cd <repository-folder-name>

# Install project dependencies
npm install

# Run the developer hot-server
npm run dev
```
Open up your browser and visit `http://localhost:3000` to start swimming!

---

### 🍎 On a Fresh macOS Machine

1. Open your terminal and install Homebrew if you haven't (visit [brew.sh](https://brew.sh)):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install Node.js and Git:
   ```bash
   brew install node git
   ```
3. Setup and Run:
   ```bash
   git clone <repository-url-here>
   cd <repository-folder-name>
   npm install
   npm run dev
   ```

---

## 📦 Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode. Opens local developer server on `http://localhost:3000`.

### `npm run build`
Compiles and builds the production-ready static assets to the `dist/` directory. Optimized and minified for swift deployment.

### `npm run preview`
Locally previews your production-built distribution assets before publishing.

### `npm run lint`
Checks TypeScript type-safety across compile routes without writing output files.

---

## 🎨 Technology Stack

- **React 19** - Component-based framework structure.
- **Vite** - Lightning-fast build tool and bundler.
- **Tailwind CSS v4** - Beautiful utility styling.
- **Bricolage Grotesque & Outfit Fonts** - Playful yet modern typographic headings.
- **Lucide React** - High-contrast vector icons.
- **HTML5 Canvas** - Smooth, GPU-accelerated gameplay canvas with sound synthesis.

---

Have fun exploring the depths of the ocean! 🌊🦑
🤖 *Created and designed with care.*
