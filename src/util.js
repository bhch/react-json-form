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
    let csrfCookies = document.cookie.split(';').filter((item) => item.trim().indexOf('csrftoken=') === 0);

    if (csrfCookies.length) {
        return csrfCookies[0].split('=')[1];
    } else {
        // if no cookie found, get the value from the csrf form input
        let input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (input)
            return input.value;
    }

    return null;
}
