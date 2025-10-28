# Space Shooter 3D

**Space Shooter 3D** is a browser‑based 3D arcade space‑shooter game built with HTML, CSS and JavaScript. The project uses a lightweight build setup (via Vite) for fast development and local deployment.

## 🚀 Features

* Real‑time 3D movement of the player ship
* Enemy ships / obstacles (basic AI)
* Score tracking & increasing difficulty over time
* Simple but engaging visuals — focus on gameplay rather than heavy assets
* Browser‑friendly: no plugin required, runs out of the box

## 🎮 Demo

You can play a live demo here: [https://spaceshooter3d.vercel.app](https://spaceshooter3d.vercel.app)
*(Hosted on Vercel for convenience)*

## 🧰 Tech Stack

* HTML5 for structure
* CSS3 for styling
* JavaScript (ES6+) for game logic
* Vite for fast development server and build bundling
* Project structure:

  ```
  /src        → source game logic, assets & modules  
  index.html  → the entry HTML file  
  style.css   → global styles  
  vite.config.js → Vite build configuration  
  package.json / package-lock.json → dependency and build metadata  
  ```

## 📦 Getting Started (Development)

1. Clone the repository:

   ```bash
   git clone https://github.com/BhaweshPandey-03/space_shooter_3d.git
   cd space_shooter_3d
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start development server:

   ```bash
   npm run dev
   ```

   Navigate to `http://localhost:5173` (or as indicated) to play and test.
4. When ready to build for production:

   ```bash
   npm run build
   ```

   The built assets will be output to `dist/`.

## 🤩 Game Controls

* Use **arrow keys / WASD** to move the player ship
* Use **Spacebar** to shoot (if implemented)
* Avoid enemy ships, collect power‑ups (if any), and survive as long as possible to rack up a high score

*(Adjust controls here based on your exact implementation)*

## 🗂️ Project Structure

```
space_shooter_3d/
├─ src/                            # Source code folder
│  ├─ assets/                      # Textures, models, sounds (if any)
│  ├─ modules/                     # Encapsulated game logic (e.g., Player, Enemy, GameManager)
│  └─ main.js                      # Entry point for game logic
├─ index.html                      # HTML entry file
├─ style.css                       # Global CSS
├─ package.json                    # Node/npm project metadata
├─ vite.config.js                  # Vite build config
└─ .gitignore                      # Files/folders to ignore in Git
```

## ✅ What’s Good in This Project

* Minimal dependency overhead – easy to understand and fork.
* Clean development workflow with Vite makes iteration fast.
* Great starting point if you want to extend the game: add new ship types, power‑ups, levels, sounds, UI, mobile input, and more.
* Demonstrates front‑end game logic and browser‑based 3D rendering (via WebGL/three‑like or raw) nicely.

## 🚧 Next Steps / Roadmap

Here are some features you might consider adding:

* Additional enemy types / behavior patterns
* Power‑ups (shields, speed boost, multi‑shot)
* Level or wave system – progressive difficulty
* High score leaderboard (localStorage or backend)
* Mobile/touch controls & responsive UI
* Sound effects and background music
* Particle effects and visual polish
* Modularisation: convert to ES6 modules, or integrate a lightweight framework.

## 👤 Contributing

Contributions are welcome! If you’d like to contribute:

1. Fork the repo
2. Create a branch for your feature (`git checkout -b feature/my‑cool‐feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to your branch (`git push origin feature/my‑cool‐feature`)
5. Open a Pull Request describing your changes

Please ensure code is clean, commented and test the game runs properly after your changes.

## 📄 License

[MIT License](./LICENSE) (or whichever license you choose)
Feel free to use, modify and distribute the project.

## 📬 Contact

Created by **Bhawesh Pandey** – feel free to raise issues or reach out for questions or suggestions.

---
