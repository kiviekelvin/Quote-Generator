const quote = document.getElementById("quote");
const author = document.getElementById("author");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const copyBtn = document.getElementById("copyBtn");

// Multiple API endpoints for maximum reliability
const apiEndpoints = [
  "https://api.quotable.io/random",
  "https://api.allorigins.win/raw?url=https://api.quotable.io/random",
  "https://cors-anywhere.herokuapp.com/https://api.quotable.io/random"
];

// Fallback quotes in case all APIs fail
const fallbackQuotes = [
  {
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    content: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    content: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon"
  },
  {
    content: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    content: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle"
  },
  {
    content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  }
];

// Load dark mode preference
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.body.classList.add('dark');
  document.querySelector('.toggle-switch').classList.add('active');
}

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function getQuote() {
  try {
    // Show loading state
    quote.innerHTML = '<div class="spinner"></div>Loading inspiring quote...';
    quote.className = 'loading';
    author.innerHTML = '';
    newQuoteBtn.disabled = true;

    let data = null;
    let lastError = null;

    // Try each API endpoint
    for (let i = 0; i < apiEndpoints.length; i++) {
      try {
        console.log(`Trying API endpoint ${i + 1}: ${apiEndpoints[i]}`);
        const response = await fetchWithTimeout(apiEndpoints[i]);
        
        if (response.ok) {
          data = await response.json();
          console.log('Successfully fetched quote:', data);
          break;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`API endpoint ${i + 1} failed:`, error.message);
        lastError = error;
        
        // If this isn't the last endpoint, continue to next
        if (i < apiEndpoints.length - 1) {
          continue;
        }
      }
    }

    // If all APIs failed, use fallback quote
    if (!data) {
      console.log('All APIs failed, using fallback quote');
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      data = fallbackQuotes[randomIndex];
    }

    // Display the quote with a small delay for better UX
    setTimeout(() => {
      quote.innerHTML = data.content;
      quote.className = '';
      author.innerHTML = `— ${data.author}`;
      newQuoteBtn.disabled = false;
    }, 500);
    
  } catch (error) {
    console.error("Unexpected error:", error);
    
    // Use fallback quote even in case of unexpected errors
    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
    const fallbackData = fallbackQuotes[randomIndex];
    
    setTimeout(() => {
      quote.innerHTML = fallbackData.content;
      quote.className = '';
      author.innerHTML = `— ${fallbackData.author}`;
      newQuoteBtn.disabled = false;
    }, 500);
  }
}

function share(platform) {
  const quoteText = quote.textContent.replace(/"/g, '').replace('Loading inspiring quote...', '').trim();
  const authorText = author.textContent;
  
  if (!quoteText || quoteText === '') {
    alert('Please wait for a quote to load before sharing!');
    return;
  }
  
  const text = `"${quoteText}" ${authorText}`;
  const encodedText = encodeURIComponent(text);
  
  let url = '';
  switch (platform) {
    case 'twitter':
      url = `https://twitter.com/intent/tweet?text=${encodedText}`;
      break;
    case 'whatsapp':
      url = `https://wa.me/?text=${encodedText}`;
      break;
    case 'linkedin':
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodedText}`;
      break;
    default:
      return;
  }
  
  window.open(url, 'share-window', 'width=600,height=400');
}

async function copyToClipboard() {
  const quoteText = quote.textContent.replace(/"/g, '').replace('Loading inspiring quote...', '').trim();
  const authorText = author.textContent;
  
  if (!quoteText || quoteText === '') {
    alert('Please wait for a quote to load before copying!');
    return;
  }
  
  const text = `"${quoteText}" ${authorText}`;
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Show success feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ Copied!';
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);
    
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      copyBtn.innerHTML = '✅ Copied!';
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (copyError) {
      alert('Copy failed. Please select and copy the text manually.');
    }
    
    document.body.removeChild(textArea);
  }
}

function toggleDarkMode() {
  const body = document.body;
  const toggle = document.querySelector('.toggle-switch');
  
  body.classList.toggle('dark');
  toggle.classList.toggle('active');
  
  // Save preference
  const isDark = body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
}

// Load initial quote
getQuote();

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    getQuote();
  } else if (e.key === 'c' || e.key === 'C') {
    copyToClipboard();
  } else if (e.key === 'd' || e.key === 'D') {
    toggleDarkMode();
  }
});

// Add retry mechanism for failed loads
window.addEventListener('online', function() {
  if (quote.classList.contains('error')) {
    getQuote();
  }
});