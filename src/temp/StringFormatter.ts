export const formatString = (template: string, replacement: any): string => {
    return template.replace(/\$\{\s*(\S+)\s*\}/g, (match: string, p1: string): string => replacement[p1]);
};