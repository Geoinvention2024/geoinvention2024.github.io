// Basic viewport scaling fix for responsive design
(function() {
    function adjustViewport() {
        const viewport = document.querySelector("meta[name=viewport]");
        if (viewport && window.innerWidth < 768) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
    }

    window.addEventListener('resize', adjustViewport);
    adjustViewport();
})();
