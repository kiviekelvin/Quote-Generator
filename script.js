const quote = document.getElementById("quote");
const author = document.getElementById("author");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const copyBtn = document.getElementById("copyBtn");

// Fallback quotes that will always work
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
  },
  {
    content: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde"
  },
  {
    content: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
    author: "Albert Einstein"
  },
  {
    content: "You only live once, but if you do it right, once is enough.",
    author: "Mae West"
  },
  {
    content: "In the end, we will remember not the words of our enemies, but the silence of our friends.",
    author: "Martin Luther King Jr."
  },
  {
    content: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    content: "Life is 10% what happens to you and 90% how you react to it.",
    author: "Charles R. Swindoll"
  }
];

// Load dark mode preference
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.body.classList.add('dark');
  document.querySelector('.toggle-switch').classList.add('active');
}

// Simple function to get random quote from fallback
function getRandomFallbackQuote() {
  const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
  return fallbackQuotes[randomIndex];
}

// Try to fetch from API with very short timeout, fallback immediately if it fails
async function tryFetchQuote() {
  try {
    // Use a JSONP-like approach that works better on mobile
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Very short timeout
    
    const response = await fetch('https://api.allorigins.win/get?url=https://api.quotable.io/random', {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const quoteData = JSON.parse(data.contents);
      return {
        content: quoteData.content,
        author: quoteData.author
      };
    } else {
      throw new Error('API response not ok');
    }
  } catch (error) {
    console.log('API failed, using fallback quote');
    return null;
  }
}

async function getQuote() {
  try {
    // Show loading state
    quote.innerHTML = '<div class="spinner"></div>Loading inspiring quote...';
    quote.className = 'loading';
    author.innerHTML = '';
    newQuoteBtn.disabled = true;

    // Try API first, but don't wait long
    let data = await tryFetchQuote();
    
    // If API failed or took too long, use fallback
    if (!data) {
      data = getRandomFallbackQuote();
    }

    // Display the quote with a small delay for better UX
    setTimeout(() => {
      quote.innerHTML = data.content;
      quote.className = '';
      author.innerHTML = `— ${data.author}`;
      newQuoteBtn.disabled = false;
    }, 500);
    
  } catch (error) {
    console.error("Error getting quote:", error);
    
    // Always fallback to local quotes
    const fallbackData = getRandomFallbackQuote();
    
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
  
  if (!quoteText || quoteText === '' || quoteText.includes('Loading')) {
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
  
  // For mobile, try to open in same window if popup fails
  try {
    const popup = window.open(url, 'share-window', 'width=600,height=400');
    if (!popup) {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
}

async function copyToClipboard() {
  const quoteText = quote.textContent.replace(/"/g, '').replace('Loading inspiring quote...', '').trim();
  const authorText = author.textContent;
  
  if (!quoteText || quoteText === '' || quoteText.includes('Loading')) {
    alert('Please wait for a quote to load before copying!');
    return;
  }
  
  const text = `"${quoteText}" ${authorText}`;
  
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('Copy command failed');
      }
    }
    
    // Show success feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ Copied!';
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);
    
  } catch (err) {
    console.error('Copy failed:', err);
    
    // Last resort: show the text in an alert for manual copying
    if (confirm('Auto-copy failed. Click OK to see the quote text to copy manually.')) {
      alert(text);
    }
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

// Load initial quote immediately
getQuote();

// Add touch-friendly event listeners for mobile
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

// Add double-tap to refresh for mobile
let lastTap = 0;
document.addEventListener('touchend', function(e) {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 500 && tapLength > 0) {
    e.preventDefault();
    getQuote();
  }
  lastTap = currentTime;
});

// Retry when coming back online
window.addEventListener('online', function() {
  getQuote();
});

// Preload a quote when the page becomes visible again
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    // Small chance to refresh quote when page becomes visible
    if (Math.random() < 0.3) {
      getQuote();
    }
  }
});
