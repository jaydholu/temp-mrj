import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Plus, Heart, Database, Download, Upload, 
  Settings, LogOut, Info, Sun, Moon, Menu, X, User 
} from 'lucide-react';
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";


const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataDropdownOpen, setDataDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, children, mobile }) => (
    <Link
      to={to}
      onClick={() => mobile && setMobileMenuOpen(false)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
        ${mobile 
          ? 'w-full hover:bg-dark-100 dark:hover:bg-dark-800' 
          : 'hover:bg-primary-50 dark:hover:bg-dark-800 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
    >
      <Icon size={20} />
      <span>{children}</span>
    </Link>
  );

  const DropdownItem = ({ icon: Icon, children, onClick, danger }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${danger 
          ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
          : 'hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-700 dark:text-dark-300'
        }`}
    >
      <Icon size={18} />
      <span className="font-medium">{children}</span>
    </button>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'glass shadow-lg' 
            : 'bg-white/70 dark:bg-dark-950/70 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center 
                            shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40
                            transition-all duration-300 group-hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif text-2xl font-bold text-gradient">My Reading</h1>
                <p className="text-sm text-dark-500 dark:text-dark-400 -mt-1">Journey</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" icon={Home}>Home</NavLink>
              {user && (
                <>
                  <NavLink to="/add-book" icon={Plus}>Add Book</NavLink>
                  <NavLink to="/favorites" icon={Heart}>Favorites</NavLink>
                  
                  {/* Data Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDataDropdownOpen(!dataDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                               hover:bg-primary-50 dark:hover:bg-dark-800 transition-all duration-200"
                    >
                      <Database size={20} />
                      <span>Data</span>
                      <motion.svg
                        animate={{ rotate: dataDropdownOpen ? 180 : 0 }}
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {dataDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full right-0 mt-2 w-56 glass-strong rounded-2xl shadow-xl p-2"
                        >
                          <DropdownItem icon={Upload} onClick={() => navigate('/import')}>
                            Import Books / Upload
                          </DropdownItem>
                          <DropdownItem icon={Download} onClick={() => navigate('/export')}>
                            Export Books / Download
                          </DropdownItem>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
              
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-800 
                         flex items-center justify-center hover:bg-dark-200 dark:hover:bg-dark-700
                         transition-colors duration-200"
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun size={20} className="text-primary-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon size={20} className="text-primary-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* User Menu */}
              {user ? (
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white
                             shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40
                             transition-all duration-200"
                  >
                    <User size={20} />
                    <span className="font-medium">{user.name}</span>
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 w-56 glass-strong rounded-2xl shadow-xl p-2"
                      >
                        <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
                          <p className="font-semibold text-dark-900 dark:text-dark-50">{user.name}</p>
                          <p className="text-sm text-dark-500 dark:text-dark-400">{user.email}</p>
                        </div>
                        <div className="py-2">
                          <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
                            Settings
                          </DropdownItem>
                          <DropdownItem icon={Info} onClick={() => navigate('/about')}>
                            About
                          </DropdownItem>
                          <div className="my-1 border-t border-dark-200 dark:border-dark-700" />
                          <DropdownItem icon={LogOut} onClick={handleLogout} danger>
                            Logout
                          </DropdownItem>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:inline-flex btn-primary"
                >
                  Login
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-800 
                         flex items-center justify-center"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 glass-strong md:hidden z-40 border-t border-dark-200 dark:border-dark-800"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-3 mb-2 rounded-xl bg-dark-100 dark:bg-dark-800">
                    <p className="font-semibold text-dark-900 dark:text-dark-50">{user.name}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{user.email}</p>
                  </div>
                  <NavLink to="/" icon={Home} mobile>Home</NavLink>
                  <NavLink to="/add-book" icon={Plus} mobile>Add Book</NavLink>
                  <NavLink to="/favorites" icon={Heart} mobile>Favorites</NavLink>
                  <NavLink to="/import" icon={Upload} mobile>Import Books</NavLink>
                  <NavLink to="/export" icon={Download} mobile>Export Books</NavLink>
                  <NavLink to="/settings" icon={Settings} mobile>Settings</NavLink>
                  <NavLink to="/about" icon={Info} mobile>About</NavLink>
                  <div className="pt-2 border-t border-dark-200 dark:border-dark-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 dark:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <NavLink to="/login" icon={User} mobile>Login</NavLink>
                  <NavLink to="/signup" icon={User} mobile>Sign Up</NavLink>
                  <NavLink to="/about" icon={Info} mobile>About</NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;