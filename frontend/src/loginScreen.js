function loginScreen() {
  document.title = "Login | EggTrack";

  root.innerHTML = `
    <main class="login-page">
      <section class="login-card">

        <div class="login-brand">
          <a class="login-brand-name" href="#">
            EggTrack
          </a>
          <p>Golden Nest Poultry Farm</p>
        </div>

        <div class="login-heading">
          <h1>Welcome Back</h1>
          <p>Sign in to access your farm dashboard.</p>
        </div>

        <form id="login-form" novalidate>
          <label for="login-email">
            Email or Username
          </label>

          <input
            id="login-email"
            name="email"
            type="text"
            placeholder="Enter your email or username"
            autocomplete="username"
            required
          >

          <label for="login-password">
            Password
          </label>

          <div class="password-field">
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            >

            <button
              class="password-toggle"
              type="button"
              data-action="toggle-password"
            >
              Show
            </button>
          </div>

          <div class="login-options">
            <span></span>

            <button
              class="login-link"
              type="button"
              data-action="forgot-password"
            >
              Forgot password?
            </button>
          </div>

          <p
            class="login-feedback"
            id="login-feedback"
            role="alert"
          ></p>

          <button
            class="button primary login-submit"
            type="submit"
          >
            Sign In
          </button>
        </form>

        <p class="login-footer">
          Authorized personnel only
        </p>

        <p class="login-demo-note">
          UI preview only: enter any non-empty
          username and password. No account is verified.
        </p>

      </section>
    </main>`;
}