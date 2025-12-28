import { Button } from './ui/button.tsx';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const isActive = (lng: string) => i18n.language === lng;

    return (
        <div className="flex gap-1">
            <Button
                variant={isActive('en') ? "secondary" : "ghost"}
                size="sm"
                onClick={() => changeLanguage('en')}
                className={isActive('en') ? "bg-white/10 text-white hover:bg-white/20" : "text-white/70 hover:text-white hover:bg-white/10"}
            >
                EN
            </Button>
            <Button
                variant={isActive('vi') ? "secondary" : "ghost"}
                size="sm"
                onClick={() => changeLanguage('vi')}
                className={isActive('vi') ? "bg-white/10 text-white hover:bg-white/20" : "text-white/70 hover:text-white hover:bg-white/10"}
            >
                VI
            </Button>
            <Button
                variant={isActive('ja') ? "secondary" : "ghost"}
                size="sm"
                onClick={() => changeLanguage('ja')}
                className={isActive('ja') ? "bg-white/10 text-white hover:bg-white/20" : "text-white/70 hover:text-white hover:bg-white/10"}
            >
                JA
            </Button>
        </div>
    );
}
