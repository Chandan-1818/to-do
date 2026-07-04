// src/components/Footer.jsx
// Simple app footer.

import { FiCheckSquare, FiGithub } from "react-icons/fi";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <FiCheckSquare className="footer__logo-icon" />
          <span className="footer__brand-name">TaskFlow</span>
        </div>
        <p className="footer__copy">
          © {year} TaskFlow — Built with the MERN Stack
        </p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="footer__github"
          aria-label="GitHub"
        >
          <FiGithub />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
