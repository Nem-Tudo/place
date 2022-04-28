module.exports = (array, item) => {

    if(typeof item === 'object'){
        return array.filter(i => JSON.stringify(i) !== JSON.stringify(item));
    }

    return array.filter(i => i != item);
}