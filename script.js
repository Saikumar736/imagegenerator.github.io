document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text');
    const generateBtn = document.getElementById('btn');
    const styleSelect = document.getElementById('style');
    const qualitySelect = document.getElementById('quality');
    const loadingElement = document.getElementById('loading');
    const optimizedPromptElement = document.getElementById('optimized-prompt');
    const imageGrid = document.getElementById('image-grid');

    // Set loading state
    function setLoading(isLoading, message = "Enhancing your prompt with AI...") {
        if (isLoading) {
            loadingElement.classList.add('active');
            optimizedPromptElement.textContent = '';
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing';
        } else {
            loadingElement.classList.remove('active');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate';
        }
    }

    // Create image card
    function createImageCard(imageUrl, prompt) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = prompt;
        img.loading = 'lazy';
        
        card.appendChild(img);
        return card;
    }

    // Optimize prompt with LLM
    async function optimizePromptWithLLM(rawPrompt, style) {
        try {
            const response = await fetch('/optimize-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: rawPrompt,
                    style: style
                })
            });

            if (!response.ok) {
                throw new Error('Failed to optimize prompt');
            }

            const data = await response.json();
            return data.optimizedPrompt;
        } catch (error) {
            console.error('LLM Error:', error);
            return rawPrompt; // Fallback to original prompt
        }
    }

    // Generate image
    async function generateImage(prompt, style, quality) {
        try {
            const response = await fetch('/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    style: style,
                    quality: quality
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            return await response.json();
        } catch (error) {
            console.error('Generation Error:', error);
            throw error;
        }
    }

    // Main generation handler
    generateBtn.addEventListener('click', async () => {
        const rawPrompt = textInput.value.trim();
        if (!rawPrompt) {
            alert('Please enter a description');
            return;
        }

        setLoading(true);
        imageGrid.innerHTML = '';

        try {
            // Step 1: Optimize prompt with LLM
            const style = styleSelect.value;
            const optimizedPrompt = await optimizePromptWithLLM(rawPrompt, style);
            optimizedPromptElement.textContent = `"${optimizedPrompt}"`;
            
            // Step 2: Generate image
            const quality = qualitySelect.value;
            const generationResult = await generateImage(optimizedPrompt, style, quality);
            
            if (generationResult.imageUrl) {
                const card = createImageCard(generationResult.imageUrl, optimizedPrompt);
                imageGrid.appendChild(card);
            } else {
                throw new Error('Failed to generate image');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    });

    // Allow pressing Enter to generate
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });
});