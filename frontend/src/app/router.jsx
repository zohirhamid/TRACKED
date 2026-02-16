import React, { useEffect, useMemo, useState } from 'react';

const normalizePath = (value) => {
  if (!value) return '/';
  if (value.startsWith('#')) return normalizePath(value.slice(1));
  if (!value.startsWith('/')) return `/${value}`;
  if (value.length > 1 && value.endsWith('/')) return value.slice(0, -1);
  return value;
};

const getHashPath = () => {
  const raw = window.location.hash || '#/';
  return normalizePath(raw.slice(1));
};

export const navigate = (to, { replace = false } = {}) => {
  const next = `#${normalizePath(to)}`;
  if (replace) {
    const { pathname, search } = window.location;
    window.location.replace(`${pathname}${search}${next}`);
    return;
  }
  window.location.hash = next;
};

export const Link = ({ to, replace = false, onClick, ...props }) => {
  const href = `#${normalizePath(to)}`;
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigate(to, { replace });
      }}
    />
  );
};

export const useRoutePath = () => {
  const [path, setPath] = useState(() => getHashPath());

  useEffect(() => {
    const onChange = () => setPath(getHashPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
};

export const RouteSwitch = ({ routes, fallback = null }) => {
  const path = useRoutePath();

  const matched = useMemo(() => {
    return routes.find((r) => r.path === path) || null;
  }, [routes, path]);

  if (!matched) return fallback;
  const Element = matched.element;
  return <Element />;
};
