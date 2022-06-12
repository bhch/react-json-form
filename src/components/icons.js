export default function Icon(props) {
    let icon;

    switch (props.name) {
        case 'chevron-up':
            icon = <ChevronUp />;
            break;
        case 'chevron-down':
            icon = <ChevronDown />;
            break;
        case 'arrow-down':
            icon = <ArrowDown />;
            break;
        case 'x-lg':
            icon = <XLg />;
            break;
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={"rjf-icon rjf-icon-" + props.name} viewBox="0 0 16 16">
            {icon}
        </svg>
    );
}

function ChevronUp(props) {
    return (
        <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
    );
}

function ChevronDown(props) {
    return (
        <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    );
}

function ArrowDown(props) {
    return (
        <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
    );
}

function XLg(props) {
    return (
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
    );
}
