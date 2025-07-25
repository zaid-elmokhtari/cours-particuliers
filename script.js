// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact form handling
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        niveau: formData.get('niveau'),
        message: formData.get('message')
    };
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Envoi en cours...';
    submitButton.disabled = true;
    
    // Send data to server
    fetch('/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Message envoyé avec succès ! Je vous répondrai rapidement.', 'success');
            this.reset();
        } else {
            showMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.', 'error');
    })
    .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
});

// Function to show success/error messages
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    // Insert before the form
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(messageDiv, form);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Function to open contact form with pre-selected level
function openContactForm(niveau) {
    const niveauSelect = document.getElementById('niveau');
    niveauSelect.value = niveau;
    
    // Scroll to contact section
    document.getElementById('contact').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Focus on name input after scroll
    setTimeout(() => {
        document.getElementById('name').focus();
    }, 1000);
}

// Header background change on scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.backgroundColor = 'rgba(102, 126, 234, 0.95)';
    } else {
        header.style.backgroundColor = 'transparent';
    }
});

// Animate statistics on scroll
function animateStats() {
    const stats = document.querySelectorAll('.stat h4');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent.replace(/[^\d]/g, '');
                if (finalValue) {
                    animateNumber(target, 0, parseInt(finalValue), 2000);
                }
            }
        });
    });
    
    stats.forEach(stat => observer.observe(stat));
}

// Animate number counting
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (range * progress));
        const suffix = element.textContent.replace(/[\d]/g, '');
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Mobile menu toggle (for future enhancement)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            field.style.borderColor = '#e0e0e0';
        }
    });
    
    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.style.borderColor = '#e74c3c';
            isValid = false;
        }
    }
    
    return isValid;
}

// Add real-time validation
document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '#e0e0e0';
        }
    });
    
    field.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(231, 76, 60)') {
            this.style.borderColor = '#e0e0e0';
        }
    });
});

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    animateStats();
    
    // Add loading animation to pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
});

// Function to update phone number (you can call this when you have the number)
function updatePhoneNumber(phoneNumber) {
    const phoneElement = document.getElementById('phone-number');
    if (phoneElement) {
        phoneElement.textContent = phoneNumber;
    }
}

// Add smooth reveal animations for sections
const revealElements = document.querySelectorAll('.about, .pricing, .contact');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
});

revealElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'all 0.8s ease';
    revealObserver.observe(element);
});

// Add floating animation to math symbols
document.addEventListener('DOMContentLoaded', function() {
    const mathSymbols = document.querySelectorAll('.math-symbol');
    mathSymbols.forEach((symbol, index) => {
        symbol.style.animationDelay = `${index * 0.5}s`;
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.math-illustration');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add hover effects for navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Auto-hide success/error messages with fade effect
function fadeOutMessage(element, delay = 5000) {
    setTimeout(() => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            element.remove();
        }, 300);
    }, delay);
}

// Enhanced message display with fade animations
function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(-10px)';
    messageDiv.style.transition = 'all 0.3s ease';
    
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(messageDiv, form);
    
    // Trigger fade in
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 100);
    
    fadeOutMessage(messageDiv);
}
// Variables globales pour l'admin
let isAdminLoggedIn = false;
let currentResources = [];

// Vérifier le statut admin au chargement
document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus();
    loadResources();
    initializeAdminFeatures();
});

function checkAdminStatus() {
    fetch('/admin/check')
        .then(response => response.json())
        .then(data => {
            isAdminLoggedIn = data.admin;
            updateAdminUI();
        })
        .catch(error => console.error('Erreur vérification admin:', error));
}

function updateAdminUI() {
    const adminSection = document.getElementById('admin-section');
    const adminLink = document.getElementById('admin-login-link');
    
    if (isAdminLoggedIn) {
        adminSection.style.display = 'block';
        adminLink.textContent = 'Déconnexion';
        adminLink.classList.add('admin-indicator');
    } else {
        adminSection.style.display = 'none';
        adminLink.textContent = 'Admin';
        adminLink.classList.remove('admin-indicator');
    }
}

function initializeAdminFeatures() {
    // Modal admin
    const adminModal = document.getElementById('admin-login-modal');
    const adminLink = document.getElementById('admin-login-link');
    const closeModal = document.querySelector('.close-admin-modal');
    const cancelBtn = document.querySelector('.admin-cancel-btn');

    adminLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (isAdminLoggedIn) {
            adminLogout();
        } else {
            adminModal.style.display = 'flex';
        }
    });

    closeModal.addEventListener('click', () => {
        adminModal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        adminModal.style.display = 'none';
    });

    // Formulaire de connexion admin
    document.getElementById('admin-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        adminLogin();
    });

    // Formulaire d'upload
    document.getElementById('upload-form').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadCourse();
    });

    // Filtres de ressources
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterResources(this.dataset.niveau);
        });
    });
}

function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-login-error');
    const submitBtn = document.querySelector('.admin-login-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion...';

    fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isAdminLoggedIn = true;
            updateAdminUI();
            document.getElementById('admin-login-modal').style.display = 'none';
            document.getElementById('admin-login-form').reset();
            showMessage('Connexion administrateur réussie', 'success');
        } else {
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
        }
    })
    .catch(error => {
        errorDiv.textContent = 'Erreur de connexion';
        errorDiv.style.display = 'block';
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
    });
}

function adminLogout() {
    fetch('/admin/logout', { method: 'POST' })
        .then(() => {
            isAdminLoggedIn = false;
            updateAdminUI();
            showMessage('Déconnexion réussie', 'info');
        });
}

function uploadCourse() {
    const form = document.getElementById('upload-form');
    const formData = new FormData(form);
    const submitBtn = form.querySelector('.upload-btn');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Upload en cours...';

    fetch('/admin/upload-cours', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Cours uploadé avec succès !', 'success');
            form.reset();
            loadResources();
        } else {
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        showMessage('Erreur lors de l\'upload', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Uploader le cours';
    });
}

function loadResources() {
    fetch('/api/cours')
        .then(response => response.json())
        .then(data => {
            currentResources = data;
            displayResources(data);
        })
        .catch(error => {
            console.error('Erreur chargement ressources:', error);
        });
}

function displayResources(resources) {
    const grid = document.getElementById('resources-grid');
    
    if (resources.length === 0) {
        grid.innerHTML = '<div class="no-resources">Aucune ressource disponible pour le moment.</div>';
        return;
    }

    grid.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <div class="resource-header">
                <h4>${resource.title}</h4>
                <span class="resource-level ${resource.niveau}">${getLevelLabel(resource.niveau)}</span>
            </div>
            <div class="resource-info">
                <div class="resource-category">${getCategoryLabel(resource.category)}</div>
                <div class="resource-description">${resource.description || 'Aucune description'}</div>
                <div class="resource-meta">
                    <span>📅 ${formatDate(resource.upload_date)}</span>
                    <span>📄 ${formatFileSize(resource.file_size)}</span>
                </div>
            </div>
            <div class="resource-actions">
                <button class="download-btn" onclick="downloadResource('${resource.filename}', '${resource.original_filename}')">
                    Télécharger
                </button>
                ${isAdminLoggedIn ? `<button class="delete-btn" onclick="deleteResource('${resource.id}')">Supprimer</button>` : ''}
            </div>
        </div>
    `).join('');
}

function filterResources(niveau) {
    if (niveau === 'all') {
        displayResources(currentResources);
    } else {
        const filtered = currentResources.filter(r => r.niveau === niveau);
        displayResources(filtered);
    }
}

function downloadResource(filename, originalFilename) {
    const link = document.createElement('a');
    link.href = `/download/${filename}`;
    link.download = originalFilename;
    link.click();
}

function deleteResource(resourceId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
        return;
    }

    fetch(`/admin/delete-cours/${resourceId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Ressource supprimée avec succès', 'success');
                loadResources();
            } else {
                showMessage(data.error, 'error');
            }
        })
        .catch(error => {
            showMessage('Erreur lors de la suppression', 'error');
        });
}

// Fonctions utilitaires
function getLevelLabel(niveau) {
    const labels = {
        'college': 'Collège',
        'lycee': 'Lycée',
        'prepa': 'Classe Préparatoire'
    };
    return labels[niveau] || niveau;
}

function getCategoryLabel(category) {
    const labels = {
        'cours': 'Cours',
        'exercices': 'Exercices',
        'corriges': 'Corrigés',
        'examens': 'Examens'
    };
    return labels[category] || category;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
