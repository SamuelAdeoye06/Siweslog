import { useEffect } from 'react'

// Sets the browser tab title for the page that calls it.
// Usage: usePageTitle('Student Dashboard')
// Result: "Student Dashboard | SIWESlog"
const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title ? `${title} | SIWESlog` : 'SIWESlog'
    // Restore the previous title on unmount, in case of any edge cases
    // with nested routes or fast navigation
    return () => {
      document.title = previousTitle
    }
  }, [title])
}

export default usePageTitle
