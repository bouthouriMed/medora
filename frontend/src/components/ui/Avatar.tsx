interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  inactive?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ firstName, lastName, size = 'md', inactive = false }: AvatarProps) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-md ${inactive ? 'bg-gray-400' : 'bg-gradient-to-br from-purple-400 to-pink-500'}`}>
      {initials}
    </div>
  );
}
