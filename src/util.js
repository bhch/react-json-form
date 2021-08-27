export const EditorContext = React.createContext();


export function capitalize(string) {
    if (!string)
        return '';
    
    return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
}


export function getVerboseName(name) {
    if (name === undefined || name === null)
        return '';

    name = name.replace(/_/g, ' ');
    return capitalize(name);
}


export function getCsrfCookie() {
    if ((document.cookie.split(';').filter((item) => item.trim().indexOf('csrftoken=') === 0)).length) {
        return document.cookie.split(';').filter((item) => item.trim().indexOf('csrftoken=') === 0)[0].split('=')[1];
    }
    return null;
}
