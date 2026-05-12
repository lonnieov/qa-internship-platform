# Site Footer Verification

## Preconditions

- App is running locally.
- Browser can open localized routes under `/ru` and `/uz`.

## Smoke Check

1. Open `/ru/sign-in/intern`.
2. Scroll to the bottom of the page.
3. Expected result: footer uses the app surface palette and shows `Click Assessment`, contact email, `Связаться с нами`, and `© 2026 Click Assessment. Все права защищены`.
4. Expected result: footer follows the page content without a visible spacer band.

## Positive Case

1. Open `/ru/sign-in/admin`.
2. Expected result: the auth brand panel does not show the old small copyright line.
3. Expected result: the footer is not visible until the page is scrolled below the first viewport.
4. Scroll to the footer.
5. Click `Связаться с нами`.
6. Expected result: a contacts modal opens.
7. Expected result: modal contains links `@lonnieov`, `@livievi_i`, and `@faxa0_0`.
8. Click each link.
9. Expected result: links target `https://t.me/lonnieov`, `https://t.me/livievi_i`, and `https://t.me/faxa0_0`.
10. Close the modal.
11. Expected result: modal disappears and the footer remains visible.
12. Open `/uz/sign-in/intern`.
13. Expected result: footer copy is shown in Uzbek and the same contact email is visible.

## Negative Cases

1. Resize the browser to a mobile width around `390px`.
2. Open `/ru/sign-in/intern`.
3. Expected result: footer columns stack vertically, the contact button spans the available width, and text does not overlap.

## Regression Check

1. Open an admin route after signing in.
2. Expected result: admin sidebar fills the visible viewport height and does not stretch past it.
3. Expected result: user, language, theme, and logout controls are pinned to the bottom of the visible sidebar.
4. Open an admin route with long content, such as `/ru/admin/interns`.
5. Expected result: the right content column scrolls while the sidebar remains fixed.
6. With the pointer over the right content column, scroll down through the end of the column content.
7. Expected result: the page continues moving to the footer without a stuck frame or a second scroll attempt.
8. While the footer is visible and the pointer is over the right content column, scroll up.
9. Expected result: the page moves back above the footer first, then the right content column scrolls upward.
10. Print an attempt report page from the browser.
11. Expected result: the global footer is not included in print output.
