# Shamir Secret Sharing with Lagrange Interpolation

#### This JavaScript program implements Shamir’s Secret Sharing to reconstruct a secret from shares using Lagrange interpolation. It converts share values from various bases to decimal with BigInt for large numbers, employs Rational arithmetic for precise calculations, and identifies incorrect shares by testing combinations of points. The code processes two test cases, outputting the secret (polynomial’s constant term) and any wrong points, ensuring accuracy without relying on non-essential built-in math functions. 

## To run
node main.js

### Sorry I have hard code the json test-case as you said us to import them as json file