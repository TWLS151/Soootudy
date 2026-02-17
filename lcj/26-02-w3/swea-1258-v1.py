'''
# 문제 조건
1. NxN 행렬 내의 sub matrix를 찾아라
2. sub matrix는 행/열 사이 0으로 구분된다
3. 출력 : sub_martrix 개수 / (크기 -> 행 작은 순) 행 열 출력

# 문제 접근
1. 행렬을 찾는 로직 필요 -> 0이 아닌 값 발견 시 범위를 늘려가며 카운팅 - while 활용해서
- checked = ([검사한 행], [열]) 을 넣어서, for의 인덱스가 해당 범위 안을 탐색하는 경우

2. 카운팅된 (행, 열)을 튜플로 리스트에 할당
3. 크기가 작은 순 -> 행이 작은 순으로 정렬 (sort(key=) 활용해보기)
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def in_range(x, y):  # 범위 검사 함수
    return 0 <= x < y

def find_submatrix(arr, visited, n):

    submatrix = checked_r = checked_c = [] # 부분행렬 정보 (행, 열)를 넣기 위한 리스트 생성
    r_cnt = 0
    c_cnt = 0


    for r in range(n): # 1. 부분행렬을 찾는 로직
        for c in range(n):

            if arr[r][c] != 0 and not visited[r][c]:  # 0이 아니고 탐색했던 범위가 아닐 경우

                while in_range(r, N) and arr[r][c] != 0: # 1-1. 행 탐색
                    r_cnt += 1      # 행 카운트 증가
                    r += 1          # 다음 행으로

                r -= r_cnt          # 다시 원래 행으로 복귀

                while in_range(c, N) and arr[r][c] != 0: # 1-2. 열 탐색
                    c_cnt += 1      # 열 카운트 증가
                    c += 1          # 다음 열로

                c -= c_cnt          # 다시 원래 열로 복귀
                submatrix.append((r_cnt, c_cnt))         # 1-3. 부분행렬 정보를 튜플로 입력

            # 2. visited : 방문한 영역을 모두 True로 바꿔버리기 - 탐색한 영역은 벗어나게
            for i in range(r, r + r_cnt):
                for j in range(c, c + c_cnt):
                    visited[i][j] = True

            r_cnt = c_cnt = 0       # 카운트 초기화

    return submatrix

for tc in range(1, T+1):

    N = int(input())

    arr = [list(map(int, input().split())) for _ in range(N)]
    visited = [[False]*N for _ in range(N)]

    result = find_submatrix(arr, visited, N)
    result.sort(key=lambda x: (x[0]*x[1], x[0], x[1]))    # (TIL) 정렬 기준 : 1. 크기 오름차순 2. 행 오름차순 3. 열 오름차순
                                                          # 앞선 기준이 같을 경우, 다음 기준으로 비교

    # 출력 양식 설정
    info = "".join(f" {r} {c}" for r, c in result) # (TIL)
    print(f"#{tc} {len(result)}{info}")