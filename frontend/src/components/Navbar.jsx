import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../services/api';

export default function Navbar({ onSelectCategory }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [propDropdown, setPropDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
    setPropDropdown(false);
  }, [location.pathname, location.search]);

  const handleCategory = (cat) => {
    setPropDropdown(false);
    setMobileMenuOpen(false);
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      navigate(`/?category=${cat}`);
    }
  };

  const isClient = user?.role === 'CLIENT';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isEmployeeManager = user?.role === 'EMPLOYEE_MANAGER';
  const isProjectManager = user?.role === 'PROJECT_MANAGER';
  const isInventoryManager = user?.role === 'INVENTORY_MANAGER';
  const isSiteManager = user?.role === 'SITE_MANAGER';
  const isClientManager = user?.role === 'CLIENT_MANAGER' || user?.role === 'ADMIN';

  return (
    <header className="odiliya-navbar">
      <div className="navbar-inner-wrap">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <img
            src="/odiliya-logo.png"
            alt="Odiliya Homes & Real Estate"
            className="brand-logo-img"
          />
          <div className="brand-logo-text">
            <span className="brand-name">ODILIYA</span>
            <span className="brand-tagline">HOMES &amp; REAL ESTATE</span>
          </div>
        </Link>

        {/* Mobile Action Controls (Quick Login + Hamburger Menu) */}
        <div className="navbar-mobile-actions">
          {!user && (
            <Link to="/login" className="btn-mobile-quick-login">
              Sign In
            </Link>
          )}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Navigation Links (Desktop bar + Mobile collapsible drawer) */}
        <nav className={`navbar-links-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>

          <div className="nav-dropdown-item">
            <button
              type="button"
              className="nav-link-item dropdown-btn"
              onClick={() => setPropDropdown(!propDropdown)}
            >
              Properties <span className="arrow-down">{propDropdown ? '▴' : '▾'}</span>
            </button>
            {propDropdown && (
              <div className="nav-dropdown-flyout">
                <button type="button" onClick={() => handleCategory('RESIDENCIES')}>
                  Residencies
                </button>
                <button type="button" onClick={() => handleCategory('LANDS')}>
                  Lands &amp; Plots
                </button>
                <button type="button" onClick={() => handleCategory('APARTMENTS')}>
                  Luxury Apartments
                </button>
              </div>
            )}
          </div>

          <a href="#about" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
            About Us
          </a>

          <a href="#contact" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
            Contact Us
          </a>

          {!isEmployee && !isEmployeeManager && (
            <Link to="/feedbacks" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
              Feedbacks
            </Link>
          )}

          {/* Quick Dashboard link if logged in */}
          {isClient && (
            <Link to="/client" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              My Client Portal
            </Link>
          )}

          {isEmployee && (
            <Link to="/employee" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              My Projects Portal
            </Link>
          )}

          {isEmployeeManager && (
            <Link to="/employee-manager" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              Employee Manager Workspace
            </Link>
          )}

          {isProjectManager && (
            <Link to="/project-manager" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              Project Manager Portal
            </Link>
          )}

          {isInventoryManager && (
            <Link to="/inventory-manager" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              Inventory Portal
            </Link>
          )}

          {isSiteManager && (
            <Link to="/site-manager" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              Site Manager Portal
            </Link>
          )}

          {isClientManager && (
            <Link to="/client-manager" className="nav-link-item highlight" onClick={() => setMobileMenuOpen(false)}>
              Client Manager Portal
            </Link>
          )}

          {/* Mobile Drawer Auth Actions */}
          <div className="mobile-drawer-auth">
            {user ? (
              <div className="mobile-user-card">
                <div className="account-avatar-circle">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
                <div className="account-details-col">
                  <span className="account-full-name">{user.displayName || user.username}</span>
                  <span className="account-role-label">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-account-logout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mobile-guest-buttons">
                <Link
                  to="/login"
                  className="btn-nav-login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-nav-register"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Top Corner: Account Name / Login (Desktop) */}
        <div className="navbar-account-corner desktop-only">
          {user ? (
            <div className="account-profile-badge">
              <div className="account-avatar-circle">
                {user.displayName?.charAt(0) || 'U'}
              </div>
              <div className="account-details-col">
                <span className="account-full-name">{user.displayName || user.username}</span>
                <span className="account-role-label">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
              <button
                type="button"
                className="btn-account-logout"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="guest-auth-actions">
              <Link to="/login" className="btn-nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-nav-register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
