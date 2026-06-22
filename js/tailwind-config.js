document.documentElement.classList.add('js');

tailwind.config = {
  theme: {
    extend: {
      colors: {
        santara: {
          forest: '#174c33',
          leaf: '#2f7d4f',
          moss: '#6f8f4e',
          lime: '#c8d96f',
          earth: '#8c6a43',
          clay: '#b87645',
          mist: '#f3f7ef',
          ink: '#143022'
        }
      },
      boxShadow: {
        soft: '0 18px 45px rgba(20, 48, 34, 0.12)',
        lift: '0 24px 70px rgba(20, 48, 34, 0.18)'
      }
    }
  }
};
