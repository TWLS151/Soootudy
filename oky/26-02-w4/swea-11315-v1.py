# SWEA-11315 오목 판정

"""
대충 풀어서 너무 지저분한데 좀 더 고민해보자.
"""

# ==================================================


T = int(input())

def is_five_in_a_row(n, grid):
    stone_cnt_dr = 0  # 오른쪽 대각선 (\)
    stone_cnt_dl = 0  # 왼쪽 대각선 (/)

    for r in range(n):
        stone_cnt_r = 0
        stone_cnt_c = 0

        for c in range(n):
            if grid[r][c] == 'o':
                stone_cnt_r += 1
                if stone_cnt_r == 5:
                    return 'YES'
            else:
                stone_cnt_r = 0

            if grid[c][r] == 'o':
                stone_cnt_c += 1
                if stone_cnt_c == 5:
                    return 'YES'
            else:
                stone_cnt_c = 0

            if c == n - 1:
                stone_cnt_r = stone_cnt_c = 0

        if grid[r][r] == 'o':
            stone_cnt_dr += 1
            if stone_cnt_dr == 5:
                return 'YES'
        else:
            stone_cnt_dr = 0

        if grid[r][n - r - 1] == 'o':
            stone_cnt_dl += 1
            if stone_cnt_dl == 5:
                return 'YES'
        else:
            stone_cnt_dl = 0

    for c in range(1, n - 4):
        stone_cnt_dr_r = stone_cnt_dr_c = 0
        nr, nc = 0, c

        while 0 <= nr < n and 0 <= nc < n:
            if grid[nr][nc] == 'o':
                stone_cnt_dr_r += 1
                if stone_cnt_dr_r == 5:
                    return 'YES'
            else:
                stone_cnt_dr_r = 0

            if grid[nc][nr] == 'o':
                stone_cnt_dr_c += 1
                if stone_cnt_dr_c == 5:
                    return 'YES'
            else:
                stone_cnt_dr_c = 0

            nr += 1
            nc += 1

    for c in range(n - 1, 3, -1):
        stone_cnt_dl_r = stone_cnt_dl_c = 0
        nr, nc = 0, c

        while 0 <= nr < n and 0 <= nc < n:
            if grid[nr][nc] == 'o':
                stone_cnt_dl_r += 1
                if stone_cnt_dl_r == 5:
                    return 'YES'
            else:
                stone_cnt_dl_r = 0

            if grid[nc][nr] == 'o':
                stone_cnt_dl_c += 1
                if stone_cnt_dl_c == 5:
                    return 'YES'
            else:
                stone_cnt_dl_c = 0

            nr += 1
            nc -= 1

    return "NO"

for test_case in range(1, T + 1):
    N = int(input())
    plate = [input() for _ in range(N)]

    print(f'#{test_case} {is_five_in_a_row(N, plate)}')
