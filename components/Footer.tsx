const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto 
                  py-4 sm:py-6 
                  px-3 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row 
                    justify-between items-center 
                    gap-2 md:gap-0">
                    <p className="text-gray-500 
                    text-xs sm:text-sm 
                    text-center md:text-left">
                        © {new Date().getFullYear()} PC_PARTS_RETAIL. All rights reserved.
                    </p>

                    <div className="flex items-center gap-1 sm:gap-2 
                      text-xs sm:text-sm 
                      text-gray-500">
                        <span>Made by</span>
                        <a
                            href="https://atharv-shelke-portfolio.vercel.app"
                            className="hover:text-blue-600"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ~Atharv Shelke
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer