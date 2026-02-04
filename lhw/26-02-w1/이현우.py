# sw 1974 번 문제입니다.
# 스도쿠 검증

TC = int(input())

for test_case in range(1, TC + 1):
    pass

# 행렬로 받기
    N = 9 # 스도쿠 크기

    sdoku = [input().split() for _ in range(N)] # 인풋 받음

# 가로 세로 9개칸으로 분기처리
# 순서대로 가면 빠를듯?
    fail = 0

    for inner in range(8):
        for outer in range(8):
            if sdoku[inner][outer] != sdoku[inner][outer + 1]:
                print(f'#{test_case} 0')
                fail += 1
                break # 변수 하나 할당할까?
        if fail != 0:
            break
        
    for outer in range(8):
        for inner in range(8):
            if sdoku[inner][outer] != sdoku[inner + 1][outer]:
                print(f'#{test_case} 0')
                fail += 1
                break
        if fail != 0:
            break    
    lst = [0, 1, 2]
    for a in lst:
        sqaure = []
        for i in lst:
            for j in lst:
                sqaure.append(sdoku[a*3 + i][a*3 + j])
    for spot in range(len(sqaure) - 1):
        if sqaure[spot] != sqaure[spot + 1]:
            print(f'#{test_case} 0')
            fail += 1
            break
    if fail != 0:
        break    
    print(f'#{test_case} 1')


#     for # 9칸 안에 확인
#     # 0,0 0,1 0,2
#     # 1,0 1,1 1,2
#     # 2,0 2,1 2,2

#     i,j i,j+1 1,j+2
#     i+1,j 1+1,j+1 i+1, j+2
#     i+2,j 1+2,j+1 i+2, j+2
#     0,0
#     i+1,j i+

# for height in range(len(sdoku)):





