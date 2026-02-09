# SWEA - 4613
# 러시아 국기 같은 깃발
# TTP: 58'16"

import sys
sys.stdin = open('like_russian.txt')

TC = int(input())

for test_case in range(1, TC+1):
    height, width = map(int, input().split())
    flag = [input() for _ in range(height)]
    
    # 최소값 높게 설정 잊지 말아요~
    min_count = 10**99
    # 세 파트로 나누는 것도 고려해서 범위 설정을 잘 해야해요
    for i in range(height - 2):
        for j in range(i+1, height - 1):
            # 몇 번 칠해야하는 지도 잘 세야하구요
            count = 0
            # 색 별로 구역을 나눠줬어요.
            W = [flag[x] for x in range(i+1)]
            B = [flag[x] for x in range(i+1, j+1)]
            R = [flag[x] for x in range(j+1, height)]
            # 구역별로 칠해야하는 색과 다른 색을 찾아서 카운팅도 해주구요.
            for w in W:
                count += width - w.count('W')
            for b in B:
                count += width - b.count('B')
            for r in R:
                count += width - r.count('R')
            # 다른 경우의 수의 카운팅과 비교해서 최솟값을 갱신해요.
            if min_count > count:
                min_count = count
    # 끝까지 찾고 출력까지 해주면 완성!
    print(f'#{test_case} {min_count}')


# -------------------- 폐기 --------------------- #

    # 직접 칠하는 방식으로는 안되겠다.
    # count = 0
    # min_count = 10**99
    # for i in range(height - 2):
    #     for j in range(i+1, height - 1):
    #         for l in range(i+j+1, height):
    #             for k in range(width):
    #                 if flag[i][k] != 'W':
    #                     flag[i][k] = 'W'
    #                     count += 1
    #                 if flag[j][k] != 'B':
    #                     flag[j][k] = 'B'
    #                     count += 1
    #                 if flag[l][k] != 'R':
    #                     flag[l][k] = 'R'
    #                     count += 1
    #         if min_count > count:
    #             min_count = count
