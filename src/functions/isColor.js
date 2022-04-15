module.exports = (string) => {

    if (string.length === 7 && string.charAt(0) === '#' && string.match(/^#[0-9A-F]{6}$/i)) {
        return true;
    }
    return false;
    
}